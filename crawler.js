const puppeteer = require("puppeteer");
const xlsx = require("xlsx");
const fs = require("fs");

// Define the URL for the Tiki category you want to scrape
const CATEGORY_URL = "https://tiki.vn/dien-thoai-smartphone/c1795";

async function scrapeData() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(CATEGORY_URL, { waitUntil: "networkidle2" });

  const products = await page.evaluate(() => {
    const items = [];
    const productElements = document.querySelectorAll(".product-item");

    productElements.forEach((element) => {
      const name = element.querySelector(".style__NameStyled-sc-139nb47-8")?.innerText?.trim() || "No name";
      const brand = element.querySelector(".above-product-name-info")?.innerText?.trim() || "No brand";
      const price = element.querySelector(".price-discount__price")?.innerText?.trim() || "No price";
      const link = element.getAttribute("href") || "#";
      const image =
        element.querySelector("img")?.getAttribute("srcset")?.split(",")[0].trim().split(" ")[0] || "No image";
      const ratingStars = element.querySelectorAll(".styles__StyledStars-sc-1rfnefa-0 path[fill='#FFC400']").length;
      const quantitySold = element.querySelector(".quantity.has-border")?.innerText?.trim() || "No quantity";

      items.push({
        name,
        brand,
        price,
        rating: `${ratingStars} / 5`,
        link: `https://tiki.vn${link}`,
        image,
        quantitySold,
      });
    });

    return items;
  });

  await browser.close();
  return products;
}

async function exportToExcel(data) {
  // Define workbook and worksheet
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

  // Define file path
  const filePath = "./TikiProducts.xlsx";

  // Write to Excel file
  xlsx.writeFile(workbook, filePath);

  console.log(`Data successfully exported to ${filePath}`);
}

// Main function to scrape data and export to Excel
async function main() {
  const data = await scrapeData();
  await exportToExcel(data);
}

main();
