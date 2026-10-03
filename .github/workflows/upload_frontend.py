"""
Upload the prebuilt Next standalone payload to the Hostinger Web App layout
and flip the `current` symlink — mirrors hPanel's own deploy
(versions/<id>/nodejs + current -> versions/<id>).

Strategy: tar the payload locally, upload ONE tarball, extract remotely
(thousands of small SFTP puts are impractically slow).

Env: SSH_HOST, SSH_PORT, SSH_USER, SSH_PASS, APP_DIR
Input: rac-frontend/payload (assembled by the workflow)  [+ payload.tar.gz if present]
"""

import os
import subprocess
import tarfile
import time

import paramiko

HOST = os.environ["SSH_HOST"]
PORT = int(os.environ["SSH_PORT"])
USER = os.environ["SSH_USER"]
PASS = os.environ["SSH_PASS"]
APP_DIR = os.environ["APP_DIR"]

WORKDIR = os.getcwd()  # rac-frontend
PAYLOAD_DIR = os.path.join(WORKDIR, "payload")
TARBALL = os.path.join(WORKDIR, "payload.tar.gz")
VERSION_ID = "gha-" + time.strftime("%Y%m%d-%H%M%S")
REMOTE_ROOT = f"{APP_DIR}/versions/{VERSION_ID}/nodejs"


def connect():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(
        HOST, port=PORT, username=USER, password=PASS,
        timeout=60, banner_timeout=60, auth_timeout=40,
        look_for_keys=False, allow_agent=False,
    )
    return ssh


def run(ssh, cmd, timeout=300, check=True):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    rc = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors="replace").strip()
    err = stderr.read().decode(errors="replace").strip()
    if check and rc != 0:
        raise RuntimeError(f"cmd failed ({rc}): {cmd}\n{out}\n{err}")
    return out, err


def main():
    if not os.path.exists(TARBALL):
        print("packing payload.tar.gz ...")
        with tarfile.open(TARBALL, "w:gz") as tf:
            tf.add(PAYLOAD_DIR, arcname="payload")

    print(f"connecting to {HOST}:{PORT} as {USER} ...")
    ssh = connect()
    sftp = ssh.open_sftp()

    remote_tar = f"{APP_DIR}/versions/{VERSION_ID}.tar.gz"
    run(ssh, f"mkdir -p '{APP_DIR}/versions'")

    print(f"uploading tarball ({os.path.getsize(TARBALL)/1e6:.1f} MB) ...")
    t0 = time.time()
    sftp.put(TARBALL, remote_tar)
    print(f"uploaded in {time.time()-t0:.0f}s")

    print("extracting remotely ...")
    run(ssh, f"mkdir -p '{REMOTE_ROOT}' && tar -xzf '{remote_tar}' -C '{REMOTE_ROOT}' --strip-components=1", timeout=600)
    run(ssh, f"rm -f '{remote_tar}'")

    files = run(ssh, f"find '{REMOTE_ROOT}' -type f | wc -l")[0]
    print(f"remote file count: {files}")

    if os.environ.get("TEST_NO_ACTIVATE"):
        print("TEST MODE: skipping activation")
        ssh.close()
        return

    print("activating: flipping current symlink (current -> versions/<id>, supervisor runs current/nodejs/server.js)")
    version_dir = REMOTE_ROOT.rsplit("/nodejs", 1)[0]
    run(ssh, f"ln -sfn '{version_dir}' '{APP_DIR}/current.new' && mv -Tf '{APP_DIR}/current.new' '{APP_DIR}/current'")
    # hard verify: the runtime entry must resolve through the new symlink
    check, rc = run(ssh, f"test -f '{APP_DIR}/current/nodejs/server.js' && echo OK")
    if check != 'OK':
        raise RuntimeError('activation failed: current/nodejs/server.js missing after flip')
    # kill stale next-server processes — old deployments keep holding the port and
    # serving their build; the supervisor respawns from `current` immediately
    out, rc = run(ssh, "pkill -9 -f next-server || true", check=False)
    print('stale next-server processes killed')
    print('verified: current/nodejs/server.js resolves')
    print('done:', VERSION_ID)
    ssh.close()


if __name__ == "__main__":
    main()
