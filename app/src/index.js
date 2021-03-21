import Web3 from "web3";
import starNotaryArtifact from "../../build/contracts/StarNotary.json";
import detectEthereumProvider from '@metamask/detect-provider';

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = starNotaryArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        starNotaryArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];

       this.refreshBalance();
       this.getStarsForSale();
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  //this function updates the stars the owner has and prints it in the DOM
  // it checks if the star is up for sale and builds the DOM accordingly
  refreshBalance: async function() {
    const { 
      balanceOf, 
      tokenOfOwnerByIndex,
      starsForSale,
      lookUptokenIdToStarInfo } = this.meta.methods;
    const balance = await balanceOf(this.account).call();
    const ownedStarsDOM = document.getElementById('ownedStars');
    ownedStarsDOM.innerHTML = `<p class="fs-2 fw-light p-2">Stars Owned by You:</p>`;

    for (let i = 0; i < balance; i++) {
      let id = await tokenOfOwnerByIndex(this.account, i).call();
      let name = await lookUptokenIdToStarInfo(id).call();
      let sellingFor = await starsForSale(id).call();
      ownedStarsDOM.innerHTML += `<div class="rounded-3 star-owned bg-secondary text-white lh-1 m-3 p-2"><p class="fw-light">Id: <span class="fw-bold">${id}</span></p>
      <p class="fw-light">Name: <span class="fw-bold">${name}</span></p>
      <span class="sell-badge badge bg-dark" role="button" onclick="App.showInput(${id}, ${i})">Sell for ...</span></div>`

      let starDiv = document.getElementsByClassName("star-owned")[i];

      if(sellingFor > 0) {
        let sellingForEth = this.web3.utils.fromWei(sellingFor, 'ether');
        document.getElementsByClassName('sell-badge')[i].style.display = "none";
        starDiv.innerHTML += `<span class="badge rounded-pill bg-warning text-dark">Selling for: ${sellingForEth} ETH</span>`      }
    }
  },
  // helper function that shows the input if we click on sell badge
  showInput: function(id, i) {
    let starDiv = document.getElementsByClassName("star-owned")[i];

    document.getElementsByClassName('sell-badge')[i].style.display = "none";
    starDiv.innerHTML += `<div class="input-group">
    <span class="input-group-text badge bg-danger" role="button" onclick="App.putStarForSale(${id}, ${i})">SELL</span>
    <input id="sell-input-${i}" type="number" min="0" max="100" class="popup-input form-control"></input></div>`
  },
  // this function is letting us put the star up for sale
  putStarForSale: async function(id, i) {
    const { putStarUpForSale } = this.meta.methods;
    let sellPriceEth = document.getElementById('sell-input-' + i).value;
    let sellPrice = this.web3.utils.toWei(sellPriceEth, 'ether');

    await putStarUpForSale(id, sellPrice).send({from: this.account});
    this.refreshBalance();
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },

  // added refreshBalance function inside to update the DOM
  createStar: async function() {
    const { createStar } = this.meta.methods;
    const name = document.getElementById("starName").value;
    const id = document.getElementById("starId").value;
    await createStar(name, id).send({from: this.account});
    this.refreshBalance();
    App.setStatus("New Star Owner is " + this.account + ".");
  },

  // this function searches for stars that are on sale and then adds them to our DOM
  getStarsForSale: async function() {
    const { starsForSale, totalSupply, tokenByIndex, ownerOf } = this.meta.methods;
    const supply = await totalSupply().call();
    
    const starsForSaleDOM = document.getElementById('starsForSale');
    starsForSaleDOM.innerHTML = '';

    for (let i = 0; i < supply; i++) {
      let id = await tokenByIndex(i).call()
      let price = await starsForSale(id).call();
      let priceEth = this.web3.utils.fromWei(price, 'ether');
      let starOwner = await ownerOf(id).call()
      if(price > 0 && starOwner !== this.account){
        starsForSaleDOM.innerHTML += `<div class="rounded-circle bg-dark w-25 p-5 m-1 lh-1 text-white" style="min-width: 180px; max-width: 185px;">
            <p style="margin-bottom: 8px;">Id: ${id}</p>
            <p style="margin-bottom: 8px;">Buy for: ${priceEth}</p>
            <span class="sell-badge badge bg-success" role="button" onclick="App.buyStarFunc(${id}, ${price})">BUY</span>
            <span class="sell-badge badge bg-white text-dark" role="button" onclick="App.lookUp(${id})">i</span>
          </div>`
      }
    }
  },
  // function to show the info of the star
  lookUp: async function(id) {
    const { lookUptokenIdToStarInfo } = this.meta.methods;
    let name = await lookUptokenIdToStarInfo(id).call();
    const status = document.getElementById("status");
    status.innerHTML = "The name of the star with Id of " + id + " is " + name + '.';
  },
  // function that lets users buy stars that are up for sale
  buyStarFunc: async function(id, price) {
    const { buyStar } = this.meta.methods;
    await buyStar(id).send({from: this.account, value: price});
    this.refreshBalance();
    this.getStarsForSale();
  }
};

window.App = App;

window.addEventListener("load", async function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
    );
  }
  const provider = await detectEthereumProvider();
      if (provider) {
        // From now on, this should always be true:
        // provider === window.ethereum
        App.start(); // initialize your app
      } else {
        const metamaskFail = document.getElementById('connectToMetaMask');
        metamaskFail.innerHTML = '<p class="text-center display-6 p-5 bg-danger text-white">Please install MetaMask!</p>';
      }
});
