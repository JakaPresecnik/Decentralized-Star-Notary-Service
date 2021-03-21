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
});

it ('can add the token name and token symbol properly', async() => {
    let instance = await StarNotary.deployed();
    const givenName = 'StarToken';
    const givenSymbol = 'STK';

    let tokenSymbol = await instance.symbol();
    let tokenName = await instance.name();
    assert.equal(givenName, tokenName);
    assert.equal(givenSymbol, tokenSymbol);
});

it('receives the correct name of the star for a given id', async() => {
    let instance = await StarNotary.deployed();
    let tokenId = 6;
    let starName = 'Test Name of The Star';
    await instance.createStar(starName, tokenId, {from: accounts[0]});

    let savedStarName = await instance.lookUptokenIdToStarInfo(tokenId);
    assert.equal(starName, savedStarName);
});

it('can propose the star to be exchanged', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let tokenId1 = 7;
    let starName1 = 'User1 star';
    await instance.createStar(starName1, tokenId1, {from: user1});
    let user2 = accounts[2];
    let tokenId2 = 8;
    let starName2 ='User2 star';
    await instance.createStar(starName2, tokenId2, {from: user2});

    await instance.proposeExchangeStars(tokenId1, tokenId2, {from: user1});
    assert.equal(await instance.getStarsForExchange.call(user2, tokenId2), tokenId1);
});

it('lets 2 users exchange stars', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let tokenId1 = 9;
    let starName1 = 'User1 star';
    await instance.createStar(starName1, tokenId1, {from: user1});
    let user2 = accounts[2];
    let tokenId2 = 10;
    let starName2 ='User2 star';
    await instance.createStar(starName2, tokenId2, {from: user2});

    await instance.proposeExchangeStars(tokenId1, tokenId2, {from: user1});
    await instance.exchangeStars(tokenId2, tokenId1, {from: user2});
    assert.equal(await instance.ownerOf.call(tokenId1), user2);
    assert.equal(await instance.ownerOf.call(tokenId2), user1);
});

it('lets a user transfer a star', async () => {
    let instance = await StarNotary.deployed();
    let userFrom = accounts[1];
    let starId = 11;
    let starName = 'Transfered star';
    await instance.createStar(starName, starId, {from: userFrom});
    let userTo = accounts[2];
    await instance.transferStar(userTo, starId, {from: userFrom});
    assert.equal(await instance.ownerOf.call(starId), userTo);
})

