const puppeteer = require("puppeteer");

const CATEGORY_URL = "https://tiki.vn/dien-thoai-smartphone/c1795";

async function getProductData() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(CATEGORY_URL, { waitUntil: "networkidle2" });

  const products = await page.evaluate(() => {
    const items = [];
    const productElements = document.querySelectorAll(".product-item");

    productElements.forEach((element) => {
      // Name
      const name = element.querySelector(".style__NameStyled-sc-139nb47-8")?.innerText?.trim() || "No name";

      // Brand
      const brand = element.querySelector(".above-product-name-info")?.innerText?.trim() || "No brand";

      // Price
      const price = element.querySelector(".price-discount__price")?.innerText?.trim() || "No price";

      // Link
      const link = element.getAttribute("href") || "#";

      // Image
      const image =
        element.querySelector("img")?.getAttribute("srcset")?.split(",")[0].trim().split(" ")[0] || "No image";

      // Rating
      const ratingStars = element.querySelectorAll(".styles__StyledStars-sc-1rfnefa-0 path[fill='#FFC400']").length;

      // Quantity Sold
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

  console.log(products);
}

getProductData();
