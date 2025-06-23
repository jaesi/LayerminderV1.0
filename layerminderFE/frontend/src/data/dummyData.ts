export const dummyImages = {
  outputs: [
    { id: 1, src: '/images/outputs/output1.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 2, src: '/images/outputs/output2.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 3, src: '/images/outputs/output3.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 4, src: '/images/outputs/output4.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 5, src: '/images/outputs/output5.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 6, src: '/images/outputs/output6.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 7, src: '/images/outputs/output7.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 8, src: '/images/outputs/output8.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
  ],
  references: [
    { id: 101, src: '/images/references/ref1.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 102, src: '/images/references/ref2.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 103, src: '/images/references/ref3.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 104, src: '/images/references/ref4.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 105, src: '/images/references/ref5.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 106, src: '/images/references/ref6.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
    { id: 107, src: '/images/references/ref7.jpg', isPinned: false, imageId: undefined, fileKey: undefined },
  ]
};

// AI 생성 이미지 더미 데이터
export const dummyGeneratedImages = [
  '/images/generated/gen1.png',
  '/images/generated/gen2.png', 
  '/images/generated/gen3.png',
  '/images/generated/gen4.png',
  '/images/generated/gen5.png',
  '/images/generated/gen6.png'
];

export const keywords = ['Bold', 'Subtle', 'Minimal', 'Maximal', 'Geometric', 'Organic'];

// 보드별 데이터 구조
export interface BoardData {
  id: number;
  name: string;
  images: Array<{ id: number; src: string; isPinned: boolean; type: 'output' | 'reference'; imageId?: number; fileKey?: string  }>;
  keyword: string;
}

// 보드별 더미 데이터
export const boardsData: BoardData[] = [
  {
    id: 1,
    name: 'Sofa',
    images: [
      { id: 1001, src: '/images/outputs/output1.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 1002, src: '/images/outputs/output2.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 1003, src: '/images/outputs/output3.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 1004, src: '/images/outputs/output4.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 1005, src: '/images/references/ref1.jpg', isPinned: false, type: 'reference', imageId: undefined, fileKey: undefined },
    ],
    keyword: 'Cozy'
  },
  {
    id: 2,
    name: 'Lounge Chair',
    images: [
      { id: 2001, src: '/images/outputs/output5.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 2002, src: '/images/outputs/output6.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 2003, src: '/images/outputs/output7.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 2004, src: '/images/outputs/output8.jpg', isPinned: false, type: 'output' , imageId: undefined, fileKey: undefined},
      { id: 2005, src: '/images/references/ref2.jpg', isPinned: false, type: 'reference', imageId: undefined, fileKey: undefined },
    ],
    keyword: 'Elegant'
  },
  {
    id: 3,
    name: 'Coffee Table',
    images: [
      { id: 3001, src: '/images/outputs/output1.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 3002, src: '/images/outputs/output3.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 3003, src: '/images/outputs/output5.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 3004, src: '/images/outputs/output7.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 3005, src: '/images/references/ref3.jpg', isPinned: false, type: 'reference', imageId: undefined, fileKey: undefined },
    ],
    keyword: 'Modern'
  },
  {
    id: 4,
    name: 'Stool',
    images: [
      { id: 4001, src: '/images/outputs/output2.jpg', isPinned: false, type: 'output', imageId: undefined, fileKey: undefined },
      { id: 4002, src: '/images/outputs/output4.jpg', isPinned: false, type: 'output' , imageId: undefined, fileKey: undefined},
      { id: 4003, src: '/images/outputs/output6.jpg', isPinned: false, type: 'output' , imageId: undefined, fileKey: undefined},
      { id: 4004, src: '/images/outputs/output8.jpg', isPinned: false, type: 'output' , imageId: undefined, fileKey: undefined},
      { id: 4005, src: '/images/references/ref4.jpg', isPinned: false, type: 'reference' , imageId: undefined, fileKey: undefined},
    ],
    keyword: 'Compact'
  }
];
