const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🔍 $GOALS Protocol - ROUND 4: Edge Cases", function () {
  let goalsNFT;
  let owner, addr1, addr2, oracle, regulator;
  
  const RARITY = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3, MYTHIC: 4 };
  const POSITION = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

  beforeEach(async function () {
    [owner, addr1, addr2, oracle, regulator] = await ethers.getSigners();
    
    const GoalsProtocolNFT = await ethers.getContractFactory("GoalsProtocolNFT");
    goalsNFT = await GoalsProtocolNFT.deploy(
      owner.address,
      oracle.address,
      regulator.address,
      "https://api.goalsprotocol.xyz/metadata/"
    );
    await goalsNFT.waitForDeployment();
  });

  describe("🎯 Boundary Conditions", function () {
    it("Should handle minimum stats values", async function () {
      const playerStats = {
        pace: 0,
        shooting: 0,
        passing: 0,
        dribbling: 0,
        defense: 0,
        physical: 0,
        overall: 0,
        lastUpdate: 0
      };

      await expect(
        goalsNFT.connect(addr1).mintPlayer(
          "Min Stats",
          POSITION.GK,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        )
      ).to.not.be.reverted;
    });

    it("Should handle maximum stats values", async function () {
      const playerStats = {
        pace: 65535, // Max uint16
        shooting: 65535,
        passing: 65535,
        dribbling: 65535,
        defense: 65535,
        physical: 65535,
        overall: 65535,
        lastUpdate: 4294967295 // Max uint32
      };

      await expect(
        goalsNFT.connect(addr1).mintPlayer(
          "Max Stats",
          POSITION.FWD,
          RARITY.MYTHIC,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("5.0") }
        )
      ).to.not.be.reverted;
    });

    it("Should handle exact boundary prices", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      // Test exact minimum prices
      const prices = [
        { rarity: RARITY.COMMON, price: "0.01" },
        { rarity: RARITY.RARE, price: "0.05" },
        { rarity: RARITY.EPIC, price: "0.2" },
        { rarity: RARITY.LEGENDARY, price: "1.0" },
        { rarity: RARITY.MYTHIC, price: "5.0" }
      ];

      for (const p of prices) {
        await expect(
          goalsNFT.connect(addr1).mintPlayer(
            `Test ${p.rarity}`,
            POSITION.FWD,
            p.rarity,
            playerStats,
            "ipfs://test",
            { value: ethers.parseEther(p.price) }
          )
        ).to.not.be.reverted;
      }
    });

    it("Should reject price just below minimum", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      // 0.009 ETH is less than 0.01 required for Common
      await expect(
        goalsNFT.connect(addr1).mintPlayer(
          "Underpriced",
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.009") }
        )
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("📏 String Handling", function () {
    it("Should handle empty player name", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await expect(
        goalsNFT.connect(addr1).mintPlayer(
          "",
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        )
      ).to.not.be.reverted;
    });

    it("Should handle very long player name", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      const longName = "A".repeat(1000);

      await expect(
        goalsNFT.connect(addr1).mintPlayer(
          longName,
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        )
      ).to.not.be.reverted;
    });

    it("Should handle special characters in name", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      const specialNames = [
        "Player'Name",
        'Player"Name',
        "Player\nName",
        "Player\tName",
        "Player\x00Name", // null byte
        "Плеер", // Cyrillic
        "選手", // Chinese
        "🔥🔥🔥" // Emoji
      ];

      for (let i = 0; i < specialNames.length; i++) {
        await expect(
          goalsNFT.connect(addr1).mintPlayer(
            specialNames[i],
            POSITION.FWD,
            RARITY.COMMON,
            playerStats,
            "ipfs://test",
            { value: ethers.parseEther("0.01") }
          )
        ).to.not.be.reverted;
      }
    });
  });

  describe("🕐 Time-Based Edge Cases", function () {
    it("Should handle timestamp in the past", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: 0 // Year 1970
      };

      await expect(
        goalsNFT.connect(addr1).mintPlayer(
          "Old Timestamp",
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        )
      ).to.not.be.reverted;
    });

    it("Should handle timestamp in the far future", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: 9999999999 // Year 2286
      };

      await expect(
        goalsNFT.connect(addr1).mintPlayer(
          "Future Timestamp",
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        )
      ).to.not.be.reverted;
    });

    it("Should handle rapid time changes", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );

      // Rapid time jumps
      for (let i = 0; i < 10; i++) {
        await time.increase(i % 2 === 0 ? 3600 : -1800); // Jump forward/back
        await goalsNFT.performSelfCheck(0);
      }
    });
  });

  describe("🔢 Numeric Edge Cases", function () {
    it("Should handle max uint256 in stats that allow it", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );

      const liveStats = {
        distanceCovered: ethers.MaxUint256,
        sprints: 65535,
        topSpeed: 65535,
        fatigueLevel: 100,
        passesCompleted: 65535,
        shotsOnTarget: 255,
        goals: 255,
        assists: 255,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await expect(
        goalsNFT.connect(oracle).updateLiveStats(0, liveStats)
      ).to.not.be.reverted;
    });

    it("Should handle zero values in live stats", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );

      const liveStats = {
        distanceCovered: 0,
        sprints: 0,
        topSpeed: 0,
        fatigueLevel: 0,
        passesCompleted: 0,
        shotsOnTarget: 0,
        goals: 0,
        assists: 0,
        lastUpdate: 0
      };

      await expect(
        goalsNFT.connect(oracle).updateLiveStats(0, liveStats)
      ).to.not.be.reverted;
    });
  });

  describe("🔄 State Transition Edge Cases", function () {
    it("Should handle rapid enable/disable agent", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );

      // Rapid toggle
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          await goalsNFT.connect(addr1).enableAgent(0, addr2.address);
        } else {
          await goalsNFT.connect(addr1).disableAgent(0);
        }
      }

      const tokenData = await goalsNFT.getTokenData(0);
      expect(tokenData.agentEnabled).to.be.false;
    });

    it("Should handle health state transitions", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );

      // Degrade to CRITICAL
      for (let i = 0; i < 5; i++) {
        await goalsNFT.connect(regulator).reportAgentDiagnostics(
          0, `Error ${i}`, "Not resolved", false
        );
      }

      let health = await goalsNFT.getAgentHealth(0);
      expect(health).to.equal(2); // CRITICAL

      // Recover
      await goalsNFT.connect(owner).forceAgentRecovery(0, "Force recover");
      health = await goalsNFT.getAgentHealth(0);
      expect(health).to.equal(0); // HEALTHY
    });
  });

  describe("📦 Batch Operation Limits", function () {
    it("Should handle batch check with empty array", async function () {
      await expect(goalsNFT.batchSelfCheck([])).to.not.be.reverted;
    });

    it("Should handle batch check with single item", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );

      await expect(goalsNFT.batchSelfCheck([0])).to.not.be.reverted;
    });

    it("Should handle batch check with non-existent tokens", async function () {
      // Should not revert, just skip
      await expect(goalsNFT.batchSelfCheck([999, 1000, 1001])).to.not.be.reverted;
    });

    it("Should handle batch check with mixed valid/invalid tokens", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );

      // Mix of valid (0) and invalid (999)
      await expect(goalsNFT.batchSelfCheck([0, 999, 0])).to.not.be.reverted;
    });
  });
});
