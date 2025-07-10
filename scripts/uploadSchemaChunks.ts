import weaviate from "weaviate-ts-client";
import { generateEmbedding } from "../lib/embed";
import dotenv from "dotenv";
dotenv.config();

// Initialize Weaviate client
const client = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_URL!.replace(/^https?:\/\//, ""),
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
});

// Plain-English schema chunks
const schemaChunks = [
  {
    title: "companies",
    content: "The `companies` table holds information about global suppliers. Each company record includes its unique ID, name, country of origin, and contact details like email and phone number."
  },
  {
    title: "categories",
    content: "The `categories` table organizes products into a hierarchical structure. Each category has a name, description, and may have a parent category to support subcategories (e.g., 'Snacks' under 'Food & Beverages')."
  },
  {
    title: "products",
    content: "The `products` table contains inventory data. Each product is linked to a company and a category. It includes fields like product name, SKU, cost and selling prices, and current stock levels."
  },
  {
    title: "admins",
    content: "The `admins` table stores administrative user profiles. Each admin has a unique ID, email, username, full name, assigned role (e.g., super_admin), and their geographic location."
  },
  {
    title: "transactions",
    content: "The `transactions` table logs every product sale. Each record includes a transaction ID, product sold, quantity, unit price, total amount, customer location, and transaction timestamp."
  },
  {
    title: "access_logs",
    content: "The `access_logs` table tracks admin login activity. It records who logged in, their location and IP address, timestamp of login, and whether it was successful."
  },
  {
    title: "error_logs",
    content: "The `error_logs` table stores error records detected by AI, such as mismatches in stock levels. Each entry includes the type of error, description, expected vs actual values, the affected product/admin, and severity."
  },
  {
    title: "notifications",
    content: "The `notifications` table delivers alerts to admins, often based on error log entries. It includes a title, message body, type of alert (e.g. warning), and links to the related error if applicable."
  }
];

async function main() {
  // 1. Create SchemaChunk class
  try {
    await client.schema.classDeleter().withClassName("SchemaChunk").do();
  } catch (_) {}
  await client.schema
    .classCreator()
    .withClass({
      class: "SchemaChunk",
      vectorizer: "none",
      properties: [
        { name: "title", dataType: ["text"] },
        { name: "content", dataType: ["text"] },
      ],
    })
    .do();

  // 2. Upload with embeddings
  for (const chunk of schemaChunks) {
    const vector = await generateEmbedding(chunk.content);
    await client.data
      .creator()
      .withClassName("SchemaChunk")
      .withProperties({
        title: chunk.title,
        content: chunk.content,
      })
      .withVector(vector)
      .do();
    console.log(`✅ Uploaded: ${chunk.title}`);
  }

  console.log("🎉 All schema chunks uploaded.");
}

main();
