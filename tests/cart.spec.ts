import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { products } from '../data/checkout';

test.describe('Cart', () => {
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await inventoryPage.isLoaded();
  });

  test('item added on inventory page appears correctly in cart', async () => {
    const item = products.backpack;
    await inventoryPage.addItemToCart(item.name);
    await inventoryPage.openCart();
    await cartPage.isLoaded();

    await expect(cartPage.itemName(item.name)).toBeVisible();
    await expect(cartPage.itemPrice(item.name)).toHaveText(`$${item.price.toFixed(2)}`);
    await expect(cartPage.itemDescription(item.name)).not.toBeEmpty();
    await expect(cartPage.itemQuantity(item.name)).toHaveText('1');
  });

  test('multiple items all appear in cart with correct count', async () => {
    await inventoryPage.addItemToCart(products.backpack.name);
    await inventoryPage.addItemToCart(products.bikeLight.name);
    await inventoryPage.openCart();
    await cartPage.isLoaded();

    expect(await cartPage.getItemCount()).toBe(2);
    const names = await cartPage.getAllItemNames();
    expect(names).toContain(products.backpack.name);
    expect(names).toContain(products.bikeLight.name);
  });

  test('removing item from cart empties it and clears badge', async ({ page }) => {
    const item = products.backpack.name;
    await inventoryPage.addItemToCart(item);
    await inventoryPage.openCart();
    await cartPage.isLoaded();

    await cartPage.removeItem(item);

    expect(await cartPage.isCartEmpty()).toBe(true);
    await expect(cartPage.cartBadge).not.toBeVisible();
  });

  test('continue shopping returns to inventory page', async ({ page }) => {
    await inventoryPage.addItemToCart(products.backpack.name);
    await inventoryPage.openCart();
    await cartPage.isLoaded();

    await cartPage.continueShopping();

    await expect(page).toHaveURL(/inventory.html/);
    await inventoryPage.isLoaded();
  });

  test('checkout button navigates to checkout step one', async ({ page }) => {
    await inventoryPage.addItemToCart(products.backpack.name);
    await inventoryPage.openCart();
    await cartPage.isLoaded();

    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL(/checkout-step-one.html/);
  });

  test('cart page shows empty state when no items added', async () => {
    await inventoryPage.openCart();
    await cartPage.isLoaded();

    expect(await cartPage.isCartEmpty()).toBe(true);
  });

  test('can still proceed to checkout with an empty cart', async ({ page }) => {
    await inventoryPage.openCart();
    await cartPage.isLoaded();

    await cartPage.proceedToCheckout();

    // SauceDemo allows navigating to checkout even with an empty cart;
    // adjust this assertion if your app under test blocks it instead.
    await expect(page).toHaveURL(/checkout-step-one.html/);
  });
});