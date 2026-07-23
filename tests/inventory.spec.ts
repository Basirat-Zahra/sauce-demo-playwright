import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { products } from '../data/checkout';

test.describe('@inventory Inventory / Product Listing', () => {
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await inventoryPage.isLoaded();
  });

  test('@smoke @inventory displays all 6 products with name, price, description and image', async () => {
    expect(await inventoryPage.getItemCount()).toBe(6);

    for (const product of Object.values(products)) {
      await expect(inventoryPage.itemName(product.name)).toBeVisible();
      await expect(inventoryPage.itemPrice(product.name)).toHaveText(`$${product.price.toFixed(2)}`);
      await expect(inventoryPage.itemDescription(product.name)).not.toBeEmpty();
      await expect(inventoryPage.itemImage(product.name)).toBeVisible();
    }
  });

  test('@regression @sorting sorts products by name A to Z', async () => {
    await inventoryPage.sortBy('az');
    const names = await inventoryPage.getAllItemNames();
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test('@regression @sorting sorts products by name Z to A', async () => {
    await inventoryPage.sortBy('za');
    const names = await inventoryPage.getAllItemNames();
    const sorted = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  });

  test('@regression @sorting sorts products by price low to high', async () => {
    await inventoryPage.sortBy('lohi');
    const prices = await inventoryPage.getAllItemPrices();
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  test('@regression @sorting sorts products by price high to low', async () => {
    await inventoryPage.sortBy('hilo');
    const prices = await inventoryPage.getAllItemPrices();
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  });

  test('@smoke @cart add to cart button toggles to Remove and badge updates', async () => {
    const item = products.backpack.name;

    await expect(inventoryPage.addToCartButton(item)).toBeVisible();

    await inventoryPage.addItemToCart(item);

    await expect(inventoryPage.removeButton(item)).toBeVisible();
    expect(await inventoryPage.getCartBadgeCount()).toBe(1);
  });

  test('@regression @cart adding multiple items increments badge count correctly', async () => {
    await inventoryPage.addItemToCart(products.backpack.name);
    await inventoryPage.addItemToCart(products.bikeLight.name);
    await inventoryPage.addItemToCart(products.onesie.name);

    expect(await inventoryPage.getCartBadgeCount()).toBe(3);
  });

  test('@regression @cart removing item from inventory page decrements badge and reverts button', async () => {
    const item = products.fleeceJacket.name;

    await inventoryPage.addItemToCart(item);
    expect(await inventoryPage.getCartBadgeCount()).toBe(1);

    await inventoryPage.removeItemFromCart(item);

    expect(await inventoryPage.getCartBadgeCount()).toBe(0);
    await expect(inventoryPage.addToCartButton(item)).toBeVisible();
  });

  test('@smoke @cart no badge is shown when cart is empty', async () => {
    await expect(inventoryPage.cartBadge).not.toBeVisible();
  });

  test('@smoke @cart cart icon navigates to cart page', async ({ page }) => {
    await inventoryPage.addItemToCart(products.backpack.name);
    await inventoryPage.openCart();

    await expect(page).toHaveURL(/cart.html/);
  });
});