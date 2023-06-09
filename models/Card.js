module.exports = (sequelize, DataTypes) => {
  const Card = sequelize.define(
    'Card',
    {
      cardName: {
        type: DataTypes.STRING(45),
        allowNull: false,
        primaryKey: true,
      },
      cardKind: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      cardCost: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      cardScore: {
        type: DataTypes.INTEGER(1),
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );

  const initalData = [
    {
      cardName: 'Earthen kiln',
      cardKind: 'MainFacility',
      cardCost: [
        {
          name: 'sand',
          num: 3,
          isAdd: false,
        },
        {
          name: 'stone',
          num: 1,
          isAdd: false,
        },
      ],
      cardScore: 0,
    },
    {
      cardName: 'Brazier1',
      cardKind: 'MainFacility',
      // TODO: 화덕의 경우 cost가 흙 4/5개 또는 화로 반납.. 우선 흙 4개로 설정
      cardCost: [
        {
          name: 'sand',
          num: 4,
          isAdd: false,
        },
      ],
      cardScore: 0,
    },
    {
      cardName: 'Stove1',
      cardKind: 'MainFacility',
      // TODO: 화로의 경우... cost가 흙 2/3개 또는 화로 반납.. 우선 흙 2개로 설정
      cardCost: [
        {
          name: 'sand',
          num: 2,
          isAdd: false,
        },
      ],
      cardScore: 0,
    },
    {
      cardName: 'Crushed soil',
      cardKind: 'SubFacility',
      cardCost: [],
      cardScore: 0,
    },
    {
      cardName: 'Manger',
      cardKind: 'SubFacility',
      cardCost: [
        {
          name: 'wood',
          num: 2,
          isAdd: false,
        },
      ],
      // TODO: 여물통의 경우 기본 cardScore는 0으로 설정, 추후 맨 마지막 카드 계산할 때 따로 계산하는 로직이 있는 것으로 알고 있음.
      cardScore: 0,
    },
    {
      cardName: 'Bottle',
      cardKind: 'SubFacility',
      // TODO: 병의 경우 이 카드를 낼 떄의 가족 구성원의 수에 따라 Cost가 달라짐. 시나리오 기준, 가족 구성원이 두 명일 때 이 카드를 냈기 때문에 cost는 2개로 설정
      cardCost: [
        {
          name: 'food',
          num: 1,
          isAdd: false,
        },
        {
          name: 'sand',
          num: 1,
          isAdd: false,
        },
      ],
      cardScore: 4,
    },
    {
      cardName: 'Hard ceramics',
      cardKind: 'SubFacility',
      cardCost: [
        {
          name: 'sand',
          num: 2,
          isAdd: false,
        },
      ],
      cardScore: 0,
    },
    {
      cardName: 'Small farmer',
      cardKind: 'Job',
      cardCost: [],
      cardScore: 0,
    },
    {
      cardName: 'Counselor',
      cardKind: 'Job',
      cardCost: [],
      cardScore: 0,
    },
    {
      cardName: 'Property manager',
      cardKind: 'Job',
      cardCost: [],
      cardScore: 0,
    },
    {
      cardName: 'Palanquinist',
      cardKind: 'Job',
      cardCost: [],
      cardScore: 0,
    },
  ];

  Card.sync({ force: true }).then(() => {
    Card.bulkCreate(initalData);
  });

  return Card;
};
