module.exports = (sequelize, DataTypes) => {
  const GameStatus = sequelize.define(
    'GameStatus',
    {
      room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.STRING(128),
        allowNull: false,
        primaryKey: true,
      },
      // 내 턴인가용?
      is_my_turn: {
        type: DataTypes.BOOLEAN,
      },
      // 순서 
      order_num: {
        type: DataTypes.INTEGER,
      },
      // 양 개수
      sheep_num: {
        type: DataTypes.INTEGER,
      },
      // 돼지 개수
      pig_num: {
        type: DataTypes.INTEGER,
      },
      // 소 개수
      cow_num: {
        type: DataTypes.INTEGER,
      },
      // 나무 개수
      wood_num: {
        type: DataTypes.INTEGER,
      },
      // 흙 개수
      sand_num: {
        type: DataTypes.INTEGER,
      },
      //  갈대 개수
      reed_num: {
        type: DataTypes.INTEGER,
      },
      // 돌 개수 돌 겠수~ 민하하₩
      stone_num: {
        type: DataTypes.INTEGER,
      },
      // 개인 저장소에 있는 곡식 개수
      grain_on_storage_num: {
        type: DataTypes.INTEGER,
      },
      // 개인 저장소에 있는 채소 개수
      vege_on_storage_num: {
        type: DataTypes.INTEGER,
      },
      // 밭 위에 잇는 곡식 개수
      grain_on_field_num: {
        type: DataTypes.INTEGER,
      },
      // 밭 위에 있는 채소 개수
      vege_on_field_num: {
        type: DataTypes.INTEGER,
      },
      //  농사 중인 곡식 개수
      grain_doing_num: {
        type: DataTypes.INTEGER,
      },
      // 농사 중인 채소 개수
      vege_doing_num: {
        type: DataTypes.INTEGER,
      },
      // 남은 울타리 개수
      remained_fence: {
        type: DataTypes.INTEGER,
      },
      // 남은 외양간 개수
      remained_barn: {
        type: DataTypes.INTEGER,
      },
      // 남은 가족 개수
      remained_family: {
        type: DataTypes.INTEGER,
      },
      // 성인 개수
      adult_num: {
        type: DataTypes.INTEGER,
      },
      // 아기 개수
      baby_num: {
        type: DataTypes.INTEGER,
      },
      // 나무집 개수
      wood_house_num: {
        type: DataTypes.INTEGER,
      },
      // 흙집 개수
      sand_house_num: {
        type: DataTypes.INTEGER,
      },
      // 돌집 개수
      stone_house_num: {
        type: DataTypes.INTEGER,
      },
      // 밭 개수
      field_num: {
        type: DataTypes.INTEGER,
      },
      // 식량 개수
      food_num: {
        type: DataTypes.INTEGER,
      },
      // 남은 직업카드 
      remained_job_card: {
        type: DataTypes.JSON,
      },
      // 사용한 직업카드 
      used_job_card: {
        type: DataTypes.JSON,
      },
      // 남은 주요설비
      remained_main_facility_card: {
        type: DataTypes.JSON,
      },
      // 사용한 주요설비
      used_main_facility_card: {
        type: DataTypes.JSON,
      },
      // 남은 보조설비
      remained_sub_facility_card: {
        type: DataTypes.JSON,
      },
      // 사용한 보조설비
      used_sub_facility_card: {
        type: DataTypes.JSON,
      },
      // 구걸토큰 개수
      num_of_begging_token:{
        type:DataTypes.INTEGER,
      }
    },
    {
      timestamps: false,
    }
  );
  return GameStatus;
};
