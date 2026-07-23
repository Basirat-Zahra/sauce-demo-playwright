import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly inventoryList: Locator;
  readonly inventoryItems: Locator;
  readonly sortDropdown: Locator;
  readonly cartBadge: Locator;
  readonly cartIcon: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inventoryList = page.locator('.inventory_list');
    this.inventoryItems = page.locator('.inventory_item');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartIcon = page.locator('.shopping_cart_link');
    this.pageTitle = page.locator('.title');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  async isLoaded() {
    await expect(this.pageTitle).toHaveText('Products');
  }

  // ---- Item locators ----
  private itemCard(name: string): Locator {
    return this.inventoryItems.filter({ hasText: name });
  }

  itemName(name: string): Locator {
    return this.itemCard(name).locator('.inventory_item_name');
  }

  itemPrice(name: string): Locator {
    return this.itemCard(name).locator('.inventory_item_price');
  }

  itemDescription(name: string): Locator {
    return this.itemCard(name).locator('.inventory_item_desc');
  }

  itemImage(name: string): Locator {
    return this.itemCard(name).locator('img.inventory_item_img');
  }

  addToCartButton(name: string): Locator {
    return this.itemCard(name).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(name: string): Locator {
    return this.itemCard(name).getByRole('button', { name: 'Remove' });
  }

  // ---- Actions ----
  async addItemToCart(name: string) {
    await this.addToCartButton(name).click();
  }

  async removeItemFromCart(name: string) {
    await this.removeButton(name).click();
  }

  async getItemCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  async getCartBadgeCount(): Promise<number> {
    const isVisible = await this.cartBadge.isVisible();
    if (!isVisible) return 0;
    return Number(await this.cartBadge.textContent());
  }

  async openCart() {
    await this.cartIcon.click();
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo') {
    await this.sortDropdown.selectOption(option);
  }

  async getAllItemNames(): Promise<string[]> {
    return this.page.locator('.inventory_item_name').allTextContents();
  }

  async getAllItemPrices(): Promise<number[]> {
    const priceTexts = await this.page.locator('.inventory_item_price').allTextContents();
    return priceTexts.map((p) => parseFloat(p.replace('$', '')));
  }

  async openItemDetails(name: string) {
    await this.itemName(name).click();
  }
}