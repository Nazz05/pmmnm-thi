export const mockAdminProducts = [
  {
    id: 1,
    name: "Ao polo basic",
    category: "Nam",
    price: 320000,
    quantum: 24,
    imageUrl: "",
    description: "Ao polo chat vai cotton mem"
  },
  {
    id: 2,
    name: "Vay midi linen",
    category: "Nu",
    price: 540000,
    quantum: 16,
    imageUrl: "",
    description: "Vay midi phong cach toi gian"
  },
  {
    id: 3,
    name: "Sneaker street",
    category: "Giay",
    price: 790000,
    quantum: 31,
    imageUrl: "",
    description: "De cao su, di em"
  },
  {
    id: 4,
    name: "Tui tote canvas",
    category: "Phu kien",
    price: 210000,
    quantum: 42,
    imageUrl: "",
    description: "Tui tote dung laptop 14 inch"
  }
];

export const mockAdminUsers = [
  {
    id: 101,
    username: "admin",
    fullName: "Nguyen Van Admin",
    email: "admin@ltwnc.dev",
    phone: "0900000001",
    role: "ADMIN",
    status: "active"
  },
  {
    id: 102,
    username: "staff01",
    fullName: "Tran Thi Staff",
    email: "staff01@ltwnc.dev",
    phone: "0900000002",
    role: "STAFF",
    status: "active"
  },
  {
    id: 103,
    username: "user01",
    fullName: "Le Van User",
    email: "user01@ltwnc.dev",
    phone: "0900000003",
    role: "USER",
    status: "inactive"
  }
];

export const mockAdminOrders = [
  {
    id: 5001,
    customerId: 102,
    itemDetails: [
      { name: "Ao polo basic", quantity: 2 },
      { name: "Tui tote canvas", quantity: 1 }
    ],
    total: 850000,
    shippingFee: 30000,
    status: "PAID",
    address: "12 Nguyen Trai, Q1, TP HCM",
    createdAt: "2026-04-07T08:30:00.000Z"
  },
  {
    id: 5002,
    customerId: 103,
    itemDetails: [{ name: "Sneaker street", quantity: 1 }],
    total: 790000,
    shippingFee: 0,
    status: "PENDING",
    address: "88 Le Loi, Q3, TP HCM",
    createdAt: "2026-04-08T14:20:00.000Z"
  },
  {
    id: 5003,
    customerId: 104,
    itemDetails: [{ name: "Vay midi linen", quantity: 1 }],
    total: 540000,
    shippingFee: 30000,
    status: "DELIVERED",
    address: "5 Bach Dang, Hai Chau, Da Nang",
    createdAt: "2026-04-09T04:10:00.000Z"
  }
];

export const mockRevenueSummary = {
  totalRevenue: 2180000,
  totalOrders: 3,
  averageOrderValue: 726666
};

export const mockDailyRevenue = [
  { date: "2026-04-05", amount: 240000, orders: 1, products: 1 },
  { date: "2026-04-06", amount: 520000, orders: 2, products: 3 },
  { date: "2026-04-07", amount: 880000, orders: 2, products: 4 },
  { date: "2026-04-08", amount: 300000, orders: 1, products: 1 },
  { date: "2026-04-09", amount: 240000, orders: 1, products: 2 }
];

export const mockAuditLogs = [
  {
    id: 1,
    actionType: "LOGIN",
    entityName: "USER",
    entityId: "101",
    userId: 101,
    sourceService: "frontend",
    createdAt: "2026-04-09T08:20:00.000Z"
  },
  {
    id: 2,
    actionType: "UPDATE",
    entityName: "PRODUCT",
    entityId: "2",
    userId: 101,
    sourceService: "frontend",
    createdAt: "2026-04-09T08:35:00.000Z"
  },
  {
    id: 3,
    actionType: "CREATE",
    entityName: "ORDER",
    entityId: "5003",
    userId: 103,
    sourceService: "frontend",
    createdAt: "2026-04-09T09:00:00.000Z"
  },
  {
    id: 4,
    actionType: "DELETE",
    entityName: "PRODUCT",
    entityId: "4",
    userId: 101,
    sourceService: "frontend",
    createdAt: "2026-04-09T09:30:00.000Z"
  },
  {
    id: 5,
    actionType: "LOGOUT",
    entityName: "USER",
    entityId: "101",
    userId: 101,
    sourceService: "frontend",
    createdAt: "2026-04-09T10:00:00.000Z"
  }
];
