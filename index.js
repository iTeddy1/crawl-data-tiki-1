const puppeteer = require("puppeteer");
const fs = require("fs");
const xlsx = require("xlsx");

// URL danh mục sản phẩm
const CATEGORY_URL = "https://tiki.vn/dien-thoai-smartphone/c1795";

async function scrapeData() {
  const browser = await puppeteer.launch({ headless: false }); // Hiển thị trình duyệt
  const page = await browser.newPage();
  await page.goto(CATEGORY_URL, { waitUntil: "networkidle2" });

  // Lấy danh sách link sản phẩm từ trang danh mục
  const productLinks = await page.evaluate(() => {
    const links = [];
    const productElements = document.querySelectorAll(".product-item");

    productElements.forEach((element) => {
      const link = element.getAttribute("href") || "#";
      if (link.includes("pixel")) {
        links.push(`https:${link}`);
      } else {
        links.push(`https://tiki.vn${link}`);
      }
    });
    return links;
  });

  console.log(`Tìm thấy ${productLinks.length} sản phẩm.`);

  // Duyệt qua từng link sản phẩm để crawl thông tin chi tiết
  const products = [];
  for (let i = 0; i < productLinks.length; i++) {
    try {
      const productUrl = productLinks[i];
      console.log(`Đang crawl sản phẩm ${i + 1}/${productLinks.length}: ${productUrl}`);

      const productPage = await browser.newPage();
      await productPage.goto(productUrl, { waitUntil: "networkidle2" });

      const product = await productPage.evaluate((url) => {
        const name = document.querySelector(".Title__TitledStyled-sc-c64ni5-0")?.innerText || "Không có tên";
        const brand = document.querySelector(".brand-and-author a")?.innerText || "Không có thương hiệu";
        const price = document.querySelector(".product-price__current-price")?.innerText || "Không có giá";
        const images =
          Array.from(
            document.querySelectorAll(".style__ProductImagesStyle-sc-15sdfel-0 .WebpImg__StyledImg-sc-h3ozu8-0"),
          )
            .map((img) => img.getAttribute("src").split(",")[0])
            .join(", ") || "Không có ảnh";
        const rating =
          document.querySelectorAll(".styles__StyledReview-sc-1onuk2l-1 div")[0]?.innerText || "Chưa có đánh giá";
        const quantitySold =
          document.querySelector(".styles__StyledQuantitySold-sc-1onuk2l-3")?.innerText.slice(7) ||
          "Chưa có thông tin số lượng đã bán";

        return { name, brand, price, images, rating, quantitySold, link: url };
      }, productUrl);

      products.push(product);
      await productPage.close();
    } catch (error) {
      console.error(`Lỗi khi crawl sản phẩm: `, error);
    }
  }

  await browser.close();
  return products;
}

async function exportToExcel(data) {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Products");
  const filePath = "./TikiProducts.xlsx";
  xlsx.writeFile(workbook, filePath);
  console.log(`Dữ liệu đã được xuất ra file ${filePath}`);
}

(async () => {
  try {
    const data = await scrapeData();
    await exportToExcel(data);
  } catch (error) {
    console.error("Lỗi trong quá trình crawl dữ liệu:", error);
  }
})();
