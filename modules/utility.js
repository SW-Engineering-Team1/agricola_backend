const gameService = require('../services/gameService');

module.exports = {
	sowSeed: function (userId, goodsList) {
		let tmp = JSON.parse(JSON.stringify(goodsList));
		tmp[0].name = tmp[0].name + "OnStorage";

		gameService.updateGoods(userId, tmp);

		goodsList[0].name = goodsList[0].name + "Doing"
		goodsList[0].isAdd = true;

		return gameService.updateGoods(userId, goodsList);
	},

	bakeBread: async function (userId, goodsList) {
		goodsList[0].name = goodsList[0].name + "OnStorage";
		gameService.updateGoods(userId, goodsList);

		goodsList[0].name = "food";
		goodsList[0].num = parseInt(goodsList[0].num) * 5;
		goodsList[0].isAdd = true;
		
		return await gameService.updateGoods(userId, goodsList);
	},

	addSubFacility: async function (goodsList, userId, roomId, facilType){
		// 총 emit 두 개(게임 방의 주요설비 판 내용 + 플레이어의 주요설비 리스트)
		await gameService.updateFacilityCard(
			goodsList[0].name,
			userId,
			roomId,
			facilType
		);

		return await gameService.getPlayerStatus(
			userId,
			roomId
		);
	}

};
