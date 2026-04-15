const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🔥 $GOALS Protocol - ROUND 2: Stress Tests", function () {
  let goalsNFT;
  let owner, addr1, addr2, oracle, regulator;
  let users = [];
  
  const RARITY = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3, MYTHIC: 4 };
  const POSITION = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

  before(async function () {
    // Create 50 test users for stress testing
    const signers = await ethers.getSigners();
    users = signers.slice(5, 55); // Get 50 users
  });

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

  describe("⚡ Gas Optimization Tests", function () {
    it("Should measure minting gas costs", async function () {
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      // Test each rarity
      const rarities = [
        { rarity: RARITY.COMMON, price: "0.01", name: "Common" },
        { rarity: RARITY.RARE, price: "0.05", name: "Rare" },
        { rarity: RARITY.EPIC, price: "0.2", name: "Epic" },
        { rarity: RARITY.LEGENDARY, price: "1.0", name: "Legendary" },
        { rarity: RARITY.MYTHIC, price: "5.0", name: "Mythic" }
      ];

      for (const r of rarities) {
        const tx = await goalsNFT.connect(addr1).mintPlayer(
          `${r.name} Player`,
          POSITION.FWD,
          r.rarity,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther(r.price) }
        );
        
        const receipt = await tx.wait();
        console.log(`  ${r.name} mint gas: ${receipt.gasUsed.toString()}`);
        
        // Set reasonable gas limits
        expect(receipt.gasUsed).to.be.lt(300000); // Should be under 300k
      }
    });

    it("Should measure stat update gas cost", async function () {
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

      const tx = await goalsNFT.connect(oracle).updateLiveStats(0, liveStats);
      const receipt = await tx.wait();
      
      console.log(`  Stat update gas: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(100000);
    });

    it("Should measure self-check gas cost", async function () {
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

      const tx = await goalsNFT.performSelfCheck(0);
      const receipt = await tx.wait();
      
      console.log(`  Self-check gas: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(80000);
    });
  });

  describe("🏋️ High Volume Stress Tests", function () {
    it("Should handle 100 rapid mints (Common)", async function () {
      this.timeout(120000); // 2 minutes
      
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      const promises = [];
      
      // Mint 100 NFTs rapidly
      for (let i = 0; i < 100; i++) {
        const user = users[i % users.length];
        promises.push(goalsNFT.connect(user).mintPlayer(
          `Player ${i}`,
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        ));
      }

      const results = await Promise.all(promises);
      expect(results).to.have.lengthOf(100);

      const totalSupply = await goalsNFT.totalSupply();
      expect(totalSupply).to.equal(100);

      console.log(`  ✅ Minted 100 NFTs successfully`);
    });

    it("Should handle rapid stat updates", async function () {
      this.timeout(60000);
      
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      // Mint 10 NFTs
      for (let i = 0; i < 10; i++) {
        await goalsNFT.connect(addr1).mintPlayer(
          `Player ${i}`,
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        );
      }

      // Rapid stat updates
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const liveStats = {
          distanceCovered: 5000 + i,
          sprints: 10 + i,
          topSpeed: 300 + i,
          fatigueLevel: 50,
          passesCompleted: 30 + i,
          shotsOnTarget: i % 5,
          goals: i,
          assists: i,
          lastUpdate: Math.floor(Date.now() / 1000) + i
        };

        promises.push(goalsNFT.connect(oracle).updateLiveStats(i, liveStats));
      }

      await Promise.all(promises);
      console.log(`  ✅ Updated 10 NFTs rapidly`);
    });

    it("Should handle batch operations", async function () {
      this.timeout(60000);
      
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      // Mint 20 NFTs
      for (let i = 0; i < 20; i++) {
        await goalsNFT.connect(addr1).mintPlayer(
          `Player ${i}`,
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        );
      }

      // Batch self-check
      const tokenIds = Array.from({length: 20}, (_, i) => i);
      const tx = await goalsNFT.batchSelfCheck(tokenIds);
      const receipt = await tx.wait();
      
      console.log(`  ✅ Batch self-check gas: ${receipt.gasUsed.toString()}`);
    });
  });

  describe("⏱️ Time-Based Tests", function () {
    it("Should handle time-delayed operations", async function () {
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

      // First self-check
      await goalsNFT.performSelfCheck(0);

      // Advance time by 1 hour
      await time.increase(3600);

      // Should allow another self-check
      await expect(goalsNFT.performSelfCheck(0))
        .to.not.be.reverted;
    });

    it("Should track consecutive errors over time", async function () {
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

      // Spread errors over time
      for (let i = 0; i < 5; i++) {
        await goalsNFT.connect(regulator).reportAgentDiagnostics(
          0,
          `Error ${i}`,
          "Not resolved",
          false
        );
        await time.increase(300); // 5 minutes between errors
      }

      const health = await goalsNFT.getAgentHealth(0);
      expect(health).to.equal(2); // CRITICAL
    });
  });

  describe("🔄 Concurrent Operations", function () {
    it("Should handle concurrent mints from different users", async function () {
      this.timeout(60000);
      
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      // 20 users mint simultaneously
      const promises = users.slice(0, 20).map((user, i) => 
        goalsNFT.connect(user).mintPlayer(
          `User${i}`,
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        )
      );

      const results = await Promise.all(promises);
      expect(results).to.have.lengthOf(20);

      // Verify each user has their token
      for (let i = 0; i < 20; i++) {
        const balance = await goalsNFT.balanceOf(users[i].address);
        expect(balance).to.equal(1);
      }

      console.log(`  ✅ 20 concurrent mints successful`);
    });

    it("Should handle concurrent stat updates", async function () {
      this.timeout(60000);
      
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      // Mint 10 NFTs
      for (let i = 0; i < 10; i++) {
        await goalsNFT.connect(addr1).mintPlayer(
          `Player ${i}`,
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        );
      }

      // Concurrent updates
      const updatePromises = [];
      for (let i = 0; i < 10; i++) {
        const liveStats = {
          distanceCovered: 5000,
          sprints: 10,
          topSpeed: 300,
          fatigueLevel: 50,
          passesCompleted: 30,
          shotsOnTarget: 2,
          goals: i + 1,
          assists: i,
          lastUpdate: Math.floor(Date.now() / 1000)
        };

        updatePromises.push(
          goalsNFT.connect(oracle).updateLiveStats(i, liveStats)
        );
      }

      await Promise.all(updatePromises);
      
      // Verify all updates applied
      for (let i = 0; i < 10; i++) {
        const data = await goalsNFT.getTokenData(i);
        expect(data.liveStats.goals).to.equal(i + 1);
      }

      console.log(`  ✅ 10 concurrent updates successful`);
    });
  });

  describe("💪 Maximum Load Tests", function () {
    it("Should handle max rarity mint limit", async function () {
      this.timeout(300000); // 5 minutes
      
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      // Get max supply for common
      const maxSupply = await goalsNFT.maxSupply(RARITY.COMMON);
      const initialSupply = await goalsNFT.currentSupply(RARITY.COMMON);
      
      console.log(`  Max Common supply: ${maxSupply}`);
      console.log(`  Initial supply: ${initialSupply}`);
      
      // This would take too long for full test, just mint 50
      const toMint = Math.min(50, Number(maxSupply) - Number(initialSupply));
      
      for (let i = 0; i < toMint; i++) {
        await goalsNFT.connect(users[i % users.length]).mintPlayer(
          `Common ${i}`,
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        );
      }

      const finalSupply = await goalsNFT.currentSupply(RARITY.COMMON);
      expect(finalSupply).to.equal(initialSupply + BigInt(toMint));

      console.log(`  ✅ Minted ${toMint} Common NFTs`);
    });

    it("Should handle large batch self-checks", async function () {
      this.timeout(120000);
      
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };

      // Mint 50 NFTs
      for (let i = 0; i < 50; i++) {
        await goalsNFT.connect(addr1).mintPlayer(
          `Player ${i}`,
          POSITION.FWD,
          RARITY.COMMON,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther("0.01") }
        );
      }

      // Batch check all 50
      const tokenIds = Array.from({length: 50}, (_, i) => i);
      const tx = await goalsNFT.batchSelfCheck(tokenIds);
      const receipt = await tx.wait();
      
      console.log(`  ✅ Batch check 50 NFTs gas: ${receipt.gasUsed.toString()}`);
      
      // Gas should scale reasonably (under 2M for 50 checks)
      expect(receipt.gasUsed).to.be.lt(2000000);
    });
  });
});
