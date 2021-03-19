const StarNotary = artifacts.require("StarNotary");

let accounts;
let owner;

contract("StarNotary", (accs) =>{
    accounts = accs;
    owner = accounts[0];
});

it('can Create a star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]});
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!');
});

it('lets user put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user = accounts[1];
    let starId = 2;
    await instance.createStar('Second star', starId, {from: user});
    let starPrice = web3.utils.toWei('.1', 'ether');
    await instance.putStarUpForSale(starId, starPrice, {from: user});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 3;
    await instance.createStar("Third star", starId, {from: user1});
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);

    let user2 = accounts[2];
    let starBuyPrice = web3.utils.toWei(".05", "ether");
    await instance.buyStar(starId, {from: user2, value: starBuyPrice});

    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    
    assert.equal(value1, value2);
});

it('lets user2 buy a star if it is put up for sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 4;
    await instance.createStar('Fourth star', starId, {from: user1});
    let starPrice = web3.utils.toWei('.01', 'ether');
    await instance.putStarUpForSale(starId, starPrice, {from: user1});

    let user2 = accounts[2];
    let starBuyPrice = web3.utils.toWei('0.05', 'ether');
    await instance.buyStar(starId, {from: user2, value: starBuyPrice});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it ('lets user2 buy a star and decreases its balance in ether', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 5;
    await instance.createStar('Fifth star', starId, {from: user1});
    let starPrice = web3.utils.toWei('.01', 'ether');
    await instance.putStarUpForSale(starId, starPrice, {from: user1});

    let user2 = accounts[2];
    let balance = web3.utils.toWei('0.05', 'ether');
    let balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);

    await instance.buyStar(starId, {from: user2, value: balance, gasPrice: 0});
    let balanceOfUser2AfterTransaction = await web3.eth.getBalance(user2);
    
    let value1 = Number(balanceOfUser2BeforeTransaction) - Number(starPrice);
    let value2 = Number(balanceOfUser2AfterTransaction);
    assert.equal(value1, value2);
})

