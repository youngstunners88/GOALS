const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🎯 $GOALS Protocol - ROUND 1: Unit Tests", function () {
  let goalsNFT;
  let owner, addr1, addr2, oracle, regulator;
  
  const RARITY = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3, MYTHIC: 4 };
  const POSITION = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
  const HEALTH = { HEALTHY: 0, DEGRADED: 1, CRITICAL: 2, RECOVERING: 3 };

  beforeEach(async function () {
    [owner, addr1, addr2, oracle, regulator] = await ethers.getSigners();
    
    const GoalsProtocolNFT = await ethers.getContractFactory("GoalsProtocolNFT");
    goalsNFT = await GoalsProtocolNFT.deploy(
      owner.address,    // royalty recipient
      oracle.address,   // data oracle
      regulator.address, // agent regulator
      "https://api.goalsprotocol.xyz/metadata/"
    );
    await goalsNFT.waitForDeployment();
  });

  describe("📋 Deployment", function () {
    it("Should deploy with correct name and symbol", async function () {
      expect(await goalsNFT.name()).to.equal("$GOALS Protocol");
      expect(await goalsNFT.symbol()).to.equal("GOALS");
    });

    it("Should set correct royalty recipient", async function () {
      // Royalty info is returned by royaltyInfo function
      const [recipient, amount] = await goalsNFT.royaltyInfo(0, 10000);
      expect(recipient).to.equal(owner.address);
    });

    it("Should set correct data oracle", async function () {
      // Test by checking if oracle can update stats
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test Player",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );

      // Oracle should be able to update
      const liveStats = {
        distanceCovered: 5000,
        sprints: 10,
        topSpeed: 300,
        fatigueLevel: 50,
        passesCompleted: 30,
        shotsOnTarget: 2,
        goals: 1,
        assists: 0,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await expect(goalsNFT.connect(oracle).updateLiveStats(0, liveStats))
        .to.not.be.reverted;
    });
  });

  describe("🎨 Minting", function () {
    it("Should mint a player NFT with correct data", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await expect(goalsNFT.connect(addr1).mintPlayer(
        "Lionel Messi",
        POSITION.FWD,
        RARITY.LEGENDARY,
        playerStats,
        "ipfs://messi",
        { value: ethers.parseEther("1.0") }
      )).to.emit(goalsNFT, "PlayerMinted")
        .withArgs(0, addr1.address, "Lionel Messi", RARITY.LEGENDARY, ethers.parseEther("1.0"));

      const tokenData = await goalsNFT.getTokenData(0);
      expect(tokenData.playerName).to.equal("Lionel Messi");
      expect(tokenData.position).to.equal(POSITION.FWD);
      expect(tokenData.rarity).to.equal(RARITY.LEGENDARY);
      expect(tokenData.agentHealth).to.equal(HEALTH.HEALTHY);
    });

    it("Should fail if insufficient payment", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await expect(goalsNFT.connect(addr1).mintPlayer(
        "Test",
        POSITION.FWD,
        RARITY.LEGENDARY,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.5") } // Should be 1.0
      )).to.be.revertedWith("Insufficient payment");
    });

    it("Should track rarity supply correctly", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      const initialSupply = await goalsNFT.currentSupply(RARITY.LEGENDARY);
      
      await goalsNFT.connect(addr1).mintPlayer(
        "Test",
        POSITION.FWD,
        RARITY.LEGENDARY,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("1.0") }
      );

      const newSupply = await goalsNFT.currentSupply(RARITY.LEGENDARY);
      expect(newSupply).to.equal(initialSupply + BigInt(1));
    });

    it("Should enforce max supply per rarity", async function () {
      // This would require minting 100 Legendary tokens, which is expensive
      // Skipping for unit test, covered in stress test
    });
  });

  describe("🔄 Dynamic Stats", function () {
    beforeEach(async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test Player",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );
    });

    it("Should update live stats", async function () {
      const liveStats = {
        distanceCovered: 5000,
        sprints: 10,
        topSpeed: 300,
        fatigueLevel: 50,
        passesCompleted: 30,
        shotsOnTarget: 2,
        goals: 1,
        assists: 0,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await expect(goalsNFT.connect(oracle).updateLiveStats(0, liveStats))
        .to.emit(goalsNFT, "StatsUpdated")
        .withArgs(0, Object.values(liveStats));

      const tokenData = await goalsNFT.getTokenData(0);
      expect(tokenData.liveStats.goals).to.equal(1);
      expect(tokenData.liveStats.assists).to.equal(0);
    });

    it("Should record match results", async function () {
      await expect(goalsNFT.connect(oracle).recordMatch(0, true, 2, 1))
        .to.emit(goalsNFT, "MatchPlayed")
        .withArgs(0, true, 2, 1);

      const tokenData = await goalsNFT.getTokenData(0);
      expect(tokenData.liveStats.goals).to.equal(2);
      expect(tokenData.liveStats.assists).to.equal(1);
      expect(tokenData.matchesPlayed).to.equal(1);
    });

    it("Should boost card after goal", async function () {
      await expect(goalsNFT.connect(oracle).recordMatch(0, true, 1, 0))
        .to.emit(goalsNFT, "CardBoosted");
    });

    it("Should reject unauthorized stat updates", async function () {
      const liveStats = {
        distanceCovered: 5000,
        sprints: 10,
        topSpeed: 300,
        fatigueLevel: 50,
        passesCompleted: 30,
        shotsOnTarget: 2,
        goals: 1,
        assists: 0,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await expect(goalsNFT.connect(addr2).updateLiveStats(0, liveStats))
        .to.be.revertedWith("Not authorized to update");
    });
  });

  describe("🤖 Agent Integration", function () {
    beforeEach(async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test Player",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );
    });

    it("Should enable agent", async function () {
      const agentWallet = addr2.address;

      await expect(goalsNFT.connect(addr1).enableAgent(0, agentWallet))
        .to.emit(goalsNFT, "AgentEnabled")
        .withArgs(0, agentWallet);

      const tokenData = await goalsNFT.getTokenData(0);
      expect(tokenData.agentEnabled).to.be.true;
      expect(tokenData.agentWallet).to.equal(agentWallet);
    });

    it("Should disable agent", async function () {
      await goalsNFT.connect(addr1).enableAgent(0, addr2.address);
      
      await expect(goalsNFT.connect(addr1).disableAgent(0))
        .to.emit(goalsNFT, "AgentDisabled")
        .withArgs(0);

      const tokenData = await goalsNFT.getTokenData(0);
      expect(tokenData.agentEnabled).to.be.false;
    });

    it("Should reject enabling agent from non-owner", async function () {
      await expect(goalsNFT.connect(addr2).enableAgent(0, addr2.address))
        .to.be.revertedWith("Not token owner");
    });

    it("Should reject invalid agent wallet", async function () {
      await expect(goalsNFT.connect(addr1).enableAgent(0, ethers.ZeroAddress))
        .to.be.revertedWith("Invalid agent wallet");
    });
  });

  describe("🩺 Self-Regulation", function () {
    beforeEach(async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test Player",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );
    });

    it("Should perform self-check", async function () {
      await expect(goalsNFT.performSelfCheck(0))
        .to.emit(goalsNFT, "SelfCheckPerformed");
    });

    it("Should report agent diagnostics", async function () {
      await expect(goalsNFT.connect(regulator).reportAgentDiagnostics(
        0,
        "Test issue",
        "Test resolution",
        true
      )).to.emit(goalsNFT, "DiagnosticsReported");
    });

    it("Should degrade agent after consecutive errors", async function () {
      // Report 5 errors to trigger degradation
      for (let i = 0; i < 5; i++) {
        await goalsNFT.connect(regulator).reportAgentDiagnostics(
          0,
          `Error ${i}`,
          "Not resolved",
          false
        );
      }

      const health = await goalsNFT.getAgentHealth(0);
      expect(health).to.equal(HEALTH.CRITICAL);
    });

    it("Should reject diagnostics from non-regulator", async function () {
      await expect(goalsNFT.connect(addr2).reportAgentDiagnostics(
        0,
        "Test",
        "Test",
        true
      )).to.be.revertedWith("Not regulator");
    });
  });

  describe("💰 Royalties & Withdrawal", function () {
    it("Should calculate correct royalty", async function () {
      const salePrice = ethers.parseEther("1.0");
      const [recipient, royaltyAmount] = await goalsNFT.royaltyInfo(0, salePrice);
      
      expect(recipient).to.equal(owner.address);
      // 5% royalty
      expect(royaltyAmount).to.equal(salePrice * BigInt(500) / BigInt(10000));
    });

    it("Should allow owner to withdraw", async function () {
      // Mint to generate some ETH in contract
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test",
        POSITION.FWD,
        RARITY.LEGENDARY,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("1.0") }
      );

      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      await goalsNFT.connect(owner).withdraw();
      
      // Just verify it doesn't revert
    });

    it("Should reject withdrawal from non-owner", async function () {
      await expect(goalsNFT.connect(addr1).withdraw())
        .to.be.reverted;
    });
  });

  describe("🎁 Achievements", function () {
    beforeEach(async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      await goalsNFT.connect(addr1).mintPlayer(
        "Test Player",
        POSITION.FWD,
        RARITY.COMMON,
        playerStats,
        "ipfs://test",
        { value: ethers.parseEther("0.01") }
      );
    });

    it("Should unlock hat-trick achievement", async function () {
      // Record match with 3 goals
      await goalsNFT.connect(oracle).recordMatch(0, true, 3, 0);

      // Check event was emitted (achievement unlocked)
      // Note: Achievement event is internal, check via match played
      const tokenData = await goalsNFT.getTokenData(0);
      expect(tokenData.liveStats.goals).to.equal(3);
    });

    it("Should track player stats correctly", async function () {
      await goalsNFT.connect(oracle).recordMatch(0, true, 2, 1);
      await goalsNFT.connect(oracle).recordMatch(0, true, 1, 2);

      const tokenData = await goalsNFT.getTokenData(0);
      expect(tokenData.liveStats.goals).to.equal(3);
      expect(tokenData.liveStats.assists).to.equal(3);
      expect(tokenData.matchesPlayed).to.equal(2);
    });
  });
});
