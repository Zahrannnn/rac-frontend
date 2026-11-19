import { describe, expect, it } from "vitest";
import { parseMapsUrl } from "./parse-maps-url";

const CAIRO = { latitude: 30.0444, longitude: 31.2357 };

describe("parseMapsUrl — q= links", () => {
  it("reads plain q=lat,lng", () => {
    expect(parseMapsUrl(`https://www.google.com/maps?q=${CAIRO.latitude},${CAIRO.longitude}`)).toEqual(CAIRO);
  });

  it("reads URL-encoded pairs inside q= (encoded comma, double-encoded too)", () => {
    expect(parseMapsUrl("https://www.google.com/maps?q=30.0444%2C31.2357")).toEqual(CAIRO);
    expect(parseMapsUrl("https://www.google.com/maps?q=30.0444%252C31.2357")).toEqual(CAIRO);
  });

  it("tolerates a place name after the pair in q=", () => {
    expect(
      parseMapsUrl(`https://www.google.com/maps?q=${CAIRO.latitude},${CAIRO.longitude}+(Cairo+Tower)`)
    ).toEqual(CAIRO);
    expect(
      parseMapsUrl(`https://www.google.com/maps?q=${CAIRO.latitude}%2C${CAIRO.longitude}%20%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9`)
    ).toEqual(CAIRO);
  });

  it("reads negative coordinates", () => {
    expect(parseMapsUrl("https://www.google.com/maps?q=-30.5,-31.25")).toEqual({
      latitude: -30.5,
      longitude: -31.25,
    });
  });
});

describe("parseMapsUrl — ll= links", () => {
  it("reads ll=lat,lng", () => {
    expect(parseMapsUrl("https://www.google.com/maps?ll=29.987,32.55")).toEqual({
      latitude: 29.987,
      longitude: 32.55,
    });
  });

  it("prefers q= over ll= when both carry a pair", () => {
    expect(parseMapsUrl("https://www.google.com/maps?q=30.0444,31.2357&ll=1,2")).toEqual(CAIRO);
  });
});

describe("parseMapsUrl — @lat,lng fragments", () => {
  it("reads @lat,lng with a zoom chunk", () => {
    expect(parseMapsUrl(`https://www.google.com/maps/@${CAIRO.latitude},${CAIRO.longitude},17z`)).toEqual(CAIRO);
  });

  it("reads @lat,lng without a zoom chunk", () => {
    expect(parseMapsUrl(`https://www.google.com/maps/@${CAIRO.latitude},${CAIRO.longitude}`)).toEqual(CAIRO);
  });

  it("reads /maps/place/…/@lat,lng deep links", () => {
    expect(
      parseMapsUrl(`https://www.google.com/maps/place/Cairo/@${CAIRO.latitude},${CAIRO.longitude},15z`)
    ).toEqual(CAIRO);
  });

  it("reads shortener-style links that carry @coords", () => {
    expect(parseMapsUrl(`https://maps.app.goo.gl/abcDEF/@${CAIRO.latitude},${CAIRO.longitude},17z`)).toEqual(
      CAIRO
    );
  });
});

describe("parseMapsUrl — plain pastes", () => {
  it("reads a bare lat,lng paste", () => {
    expect(parseMapsUrl(`${CAIRO.latitude},${CAIRO.longitude}`)).toEqual(CAIRO);
  });

  it("reads spaces around the comma", () => {
    expect(parseMapsUrl(`${CAIRO.latitude}, ${CAIRO.longitude}`)).toEqual(CAIRO);
  });

  it("reads a signed pair", () => {
    expect(parseMapsUrl("+30.0444,-31.2357")).toEqual({
      latitude: 30.0444,
      longitude: -31.2357,
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseMapsUrl(`  ${CAIRO.latitude},${CAIRO.longitude}  `)).toEqual(CAIRO);
  });
});

describe("parseMapsUrl — range validation (world bounds)", () => {
  it("accepts the exact bounds", () => {
    expect(parseMapsUrl("90,180")).toEqual({ latitude: 90, longitude: 180 });
    expect(parseMapsUrl("-90,-180")).toEqual({ latitude: -90, longitude: -180 });
  });

  it("rejects out-of-range latitude and longitude", () => {
    expect(parseMapsUrl("90.000001,31.2357")).toBeNull();
    expect(parseMapsUrl("30.0444,180.000001")).toBeNull();
    expect(parseMapsUrl("https://www.google.com/maps?q=91,31.2357")).toBeNull();
    expect(parseMapsUrl("https://www.google.com/maps?q=30.0444,181")).toBeNull();
  });
});

describe("parseMapsUrl — malformed input returns null", () => {
  it("rejects empty and blank input", () => {
    expect(parseMapsUrl("")).toBeNull();
    expect(parseMapsUrl("   ")).toBeNull();
  });

  it("rejects non-numeric pairs", () => {
    expect(parseMapsUrl("cairo,egypt")).toBeNull();
    expect(parseMapsUrl("abc")).toBeNull();
    expect(parseMapsUrl("https://www.google.com/maps?q=cairo")).toBeNull();
  });

  it("rejects a missing comma", () => {
    expect(parseMapsUrl("30.0444")).toBeNull();
    expect(parseMapsUrl("30.0444 31.2357")).toBeNull();
  });

  it("rejects Maps links without coordinates", () => {
    expect(parseMapsUrl("https://www.google.com/maps")).toBeNull();
    expect(parseMapsUrl("https://maps.app.goo.gl/abcDEF")).toBeNull();
    expect(parseMapsUrl("not a link at all")).toBeNull();
  });
});
