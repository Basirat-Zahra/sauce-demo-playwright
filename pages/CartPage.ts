import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cartItems: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('.title');
    this.cartItems = page.locator('.cart_item');
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  async goto() {
    await this.page.goto('/cart.html');
  }

  async isLoaded() {
    await expect(this.pageTitle).toHaveText('Your Cart');
  }

  private itemRow(name: string): Locator {
    return this.cartItems.filter({ hasText: name });
  }

  itemName(name: string): Locator {
    return this.itemRow(name).locator('.cart_item_label .inventory_item_name');
  }

  itemDescription(name: string): Locator {
    return this.itemRow(name).locator('.inventory_item_desc');
  }

  itemPrice(name: string): Locator {
    return this.itemRow(name).locator('.inventory_item_price');
  }

  itemQuantity(name: string): Locator {
    return this.itemRow(name).locator('.cart_quantity');
  }

  removeButton(name: string): Locator {
    return this.itemRow(name).getByRole('button', { name: 'Remove' });
  }

  async removeItem(name: string) {
    await this.removeButton(name).click();
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async getAllItemNames(): Promise<string[]> {
    return this.page.locator('.cart_item_label .inventory_item_name').allTextContents();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }

  async isCartEmpty(): Promise<boolean> {
    return (await this.cartItems.count()) === 0;
  }
}