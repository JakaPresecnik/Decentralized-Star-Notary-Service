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
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  //this function updates the stars the owner has and prints it in the DOM

  refreshBalance: async function() {
    const { balanceOf } = this.meta.methods;
    const balance = await balanceOf(this.account).call();
    const ownedStarsDOM = document.getElementById('ownedStars');
    ownedStarsDOM.innerHTML = `<p class="fs-2 fw-light p-2">Stars Owned by You:</p><p>${balance}`;

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

  // function to show the info of the star
  lookUp: async function() {
    const { lookUptokenIdToStarInfo } = this.meta.methods;
    let id = document.getElementById('lookStarId').value;
    let name = await lookUptokenIdToStarInfo(id).call();
    const status = document.getElementById("status");
    if(name === '') {
      status.innerHTML = "The star with an Id of " + id + " doesn't exist.";
    }else {
      status.innerHTML = "The name of the star with Id of " + id + " is " + name + '.';
    }
  },

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
