console.log('=== LTWNC CART DEBUG ===\n');

// 1. Check localStorage
const cart = JSON.parse(localStorage.getItem('cart') || '[]');
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

console.log('📦 localStorage data:');
console.log('   Token:', token ? 'YES' : 'NO');
console.log('   User:', user?.email || 'NO');
console.log('   Cart items:', cart.length);

if (cart.length > 0) {
  console.log('\n🛒 Cart contents:');
  cart.forEach((item, i) => {
    console.log(`   [${i}] ID=${item.id} (${typeof item.id}), Name=${item.name}, Qty=${item.quantity}`);
  });
}

// 2. Clear cart if you want
console.log('\n⚠️ To clear cart, run:');
console.log('   localStorage.removeItem("cart")');
console.log('   location.reload()');

// 3. Test order payload
console.log('\n📡 Order payload that will be sent:');
const orderPayload = {
  shippingAddr: '123 Test',
  phoneNumber: '0901234567',
  note: 'test',
  items: cart.map(item => ({
    productId: parseInt(item.id) || item.id,
    quantity: parseInt(item.quantity) || 1,
  }))
};
console.log(JSON.stringify(orderPayload, null, 2));

// 4. If cart is wrong, show fix
if (cart.length > 0 && typeof parseInt(cart[0].id) !== 'number') {
  console.log('\n🔴 PROBLEM: productId is not a valid number');
}

if (cart.length > 0 && parseInt(cart[0].id) < 78) {
  console.log('\n🔴 PROBLEM: productId is < 78 (old data!)');
  console.log('Solution: Clear cart and add product again');
  console.log('Code: localStorage.removeItem("cart"); location.reload();');
}
