const assert = require("assert");

const licensing = require("../../licensing");

describe("Licensing - Unit", () => {

  it("should recognize Rise Player Professional subscription as active", () => {
    const message = {
      from: 'licensing',
      topic: 'licensing-update',
      subscriptions: {
        c4b368be86245bf9501baaa6e0b00df9719869fd: {
          active: true, timestamp: 100
        },
        b0cba08a4baa0c62b8cdc621b6f6a124f89a03db: {
          active: true, timestamp: 100
        }
      }
    };

    assert(licensing.isRisePlayerProfessionalSubscriptionActive(message));
  });

  it("should recognize Rise Player Professional subscription as not active", () => {
    const message = {
      from: 'licensing',
      topic: 'licensing-update',
      subscriptions: {
        c4b368be86245bf9501baaa6e0b00df9719869fd: {
          active: false, timestamp: 100
        },
        b0cba08a4baa0c62b8cdc621b6f6a124f89a03db: {
          active: true, timestamp: 100
        }
      }
    };

    assert(!licensing.isRisePlayerProfessionalSubscriptionActive(message));
  });

  it("should not recognize Rise Player Professional subscription as active if missing", () => {
    const message = {
      from: 'licensing',
      topic: 'licensing-update',
      subscriptions: {
        b0cba08a4baa0c62b8cdc621b6f6a124f89a03db: {
          active: true, timestamp: 100
        }
      }
    };

    assert(!licensing.isRisePlayerProfessionalSubscriptionActive(message));
  });

  it("should not recognize Rise Player Professional subscription as active if empty", () => {
    const message = {
      from: 'licensing',
      topic: 'licensing-update',
      subscriptions: {}
    };

    assert(!licensing.isRisePlayerProfessionalSubscriptionActive(message));
  });

  it("should recognize Rise Storage subscription as active", () => {
    const message = {
      from: 'licensing',
      topic: 'licensing-update',
      subscriptions: {
        c4b368be86245bf9501baaa6e0b00df9719869fd: {
          active: true, timestamp: 100
        },
        b0cba08a4baa0c62b8cdc621b6f6a124f89a03db: {
          active: true, timestamp: 100
        }
      }
    };

    assert(licensing.isRiseStorageSubscriptionActive(message));
  });

  it("should recognize Rise Storage subscription as not active", () => {
    const message = {
      from: 'licensing',
      topic: 'licensing-update',
      subscriptions: {
        c4b368be86245bf9501baaa6e0b00df9719869fd: {
          active: true, timestamp: 100
        },
        b0cba08a4baa0c62b8cdc621b6f6a124f89a03db: {
          active: false, timestamp: 100
        }
      }
    };

    assert(!licensing.isRiseStorageSubscriptionActive(message));
  });

  it("should not recognize Rise Storage subscription as active if missing", () => {
    const message = {
      from: 'licensing',
      topic: 'licensing-update',
      subscriptions: {
        c4b368be86245bf9501baaa6e0b00df9719869fd: {
          active: true, timestamp: 100
        }
      }
    };

    assert(!licensing.isRiseStorageSubscriptionActive(message));
  });

  it("should not recognize Rise Storage subscription as active if empty", () => {
    const message = {
      from: 'licensing',
      topic: 'licensing-update',
      subscriptions: {}
    };

    assert(!licensing.isRiseStorageSubscriptionActive(message));
  });

});
