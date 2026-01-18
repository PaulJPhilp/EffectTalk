/**
 * Complex template integration tests for effect-liquid
 *
 * Tests real-world complex templates combining multiple features
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { render, compile, renderCompiled } from "../../src/index.js";

describe("Complex Template Integration", () => {
  describe("Product listing template", () => {
    it("should render product list with filters and conditions", async () => {
      const template = `
        {% for product in products %}
          {% if product.available %}
            <div class="product">
              <h2>{{ product.name | capitalize }}</h2>
              <p>${{ product.price }}</p>
              {% if product.discount %}
                <span class="discount">{{ product.discount }}% OFF</span>
              {% endif %}
            </div>
          {% endif %}
        {% endfor %}
      `

      const context = {
        products: [
          { name: "laptop", price: 999, available: true, discount: 10 },
          { name: "mouse", price: 25, available: true, discount: null },
          { name: "keyboard", price: 75, available: false, discount: 20 },
        ],
      };

      const result = await Effect.runPromise(render(template, context));

      expect(result).toContain("Laptop");
      expect(result).toContain("999");
      expect(result).toContain("10% OFF");
      expect(result).not.toContain("Keyboard");
    });

    it("should handle pagination with offset and limit", async () => {
      const template = `
        {% for item in items limit: 5 offset: 2 %}
          {{ item }},
        {% endfor %}
      `;

      const context = {
        items: Array.from({ length: 10 }, (_, i) => i + 1),
      };

      const result = await Effect.runPromise(render(template, context));

      // Should start from item 3 (offset 2) and show 5 items
      expect(result).toContain("3");
      expect(result).toContain("7");
    });
  });

  describe("Blog post template", () => {
    it("should render blog post with nested comments", async () => {
      const template = `
        <article>
          <h1>{{ post.title | upcase }}</h1>
          <p>By {{ post.author.name | capitalize }}</p>

          <div class="content">
            {{ post.content }}
          </div>

          {% if post.comments %}
            <section class="comments">
              <h2>Comments ({{ post.comments | size }})</h2>
              {% for comment in post.comments %}
                <div class="comment">
                  <strong>{{ comment.author | capitalize }}</strong>
                  <p>{{ comment.text }}</p>
                  {% if comment.replies %}
                    <ul>
                      {% for reply in comment.replies %}
                        <li>{{ reply.text }}</li>
                      {% endfor %}
                    </ul>
                  {% endif %}
                </div>
              {% endfor %}
            </section>
          {% endif %}
        </article>
      `;

      const context = {
        post: {
          title: "learning liquid",
          author: { name: "john doe" },
          content: "This is the post content.",
          comments: [
            {
              author: "alice",
              text: "Great post!",
              replies: [{ text: "Thanks!" }],
            },
            {
              author: "bob",
              text: "Very helpful.",
            },
          ],
        },
      };

      const result = await Effect.runPromise(render(template, context));

      expect(result).toContain("LEARNING LIQUID");
      expect(result).toContain("John Doe");
      expect(result).toContain("Comments (2)");
      expect(result).toContain("Alice");
      expect(result).toContain("Great post!");
    });
  });

  describe("Invoice template", () => {
    it("should render invoice with calculations and conditions", async () => {
      const template = `
        <h1>Invoice #{{ invoice.number }}</h1>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {% for line in invoice.lines %}
              <tr>
                <td>{{ line.item }}</td>
                <td>{{ line.qty }}</td>
                <td>${{ line.price }}</td>
                <td>${{ line.total }}</td>
              </tr>
            {% endfor %}
          </tbody>
        </table>

        <div class="summary">
          <p>Subtotal: ${{ invoice.subtotal }}</p>
          {% if invoice.tax > 0 %}
            <p>Tax: ${{ invoice.tax }}</p>
          {% endif %}
          <h2>Total: ${{ invoice.total }}</h2>
        </div>
      `

      const context = {
        invoice: {
          number: "INV-001",
          lines: [
            { item: "Product A", qty: 2, price: 50, total: 100 },
            { item: "Product B", qty: 1, price: 75, total: 75 },
          ],
          subtotal: 175,
          tax: 17.5,
          total: 192.5,
        },
      };

      const result = await Effect.runPromise(render(template, context));

      expect(result).toContain("INV-001");
      expect(result).toContain("Product A");
      expect(result).toContain("$192.5");
      expect(result).toContain("Tax: $17.5");
    });
  });

  describe("Email template", () => {
    it("should render personalized email with conditional content", async () => {
      const template = `
        Dear {{ user.firstName | capitalize }},

        {% if user.isPremium %}
          Thank you for being a premium member! Here are your exclusive benefits:
          {% for benefit in premiumBenefits %}
            - {{ benefit }}
          {% endfor %}
        {% else %}
          We'd love to upgrade you to premium for these benefits:
          {% for benefit in premiumBenefits %}
            - {{ benefit }}
          {% endfor %}
        {% endif %}

        {% if user.recentOrders %}
          Your recent orders:
          {% for order in user.recentOrders limit: 5 %}
            - Order #{{ order.id }}: {{ order.date }}
          {% endfor %}
        {% endif %}

        Best regards,
        The Team
      `;

      const context = {
        user: {
          firstName: "john",
          isPremium: true,
          recentOrders: [
            { id: "001", date: "2024-01-01" },
            { id: "002", date: "2024-01-05" },
          ],
        },
        premiumBenefits: [
          "Free shipping",
          "Priority support",
          "Exclusive deals",
        ],
      };

      const result = await Effect.runPromise(render(template, context));

      expect(result).toContain("Dear John");
      expect(result).toContain("premium member");
      expect(result).toContain("Free shipping");
      expect(result).toContain("Order #001");
    });
  });

  describe("Configuration template", () => {
    it("should render configuration with defaults and overrides", async () => {
      const template = `
        {
          "name": "{{ app.name }}",
          "version": "{{ app.version }}",
          "debug": {{ app.debug }},
          {% if app.endpoints %}
          "endpoints": {
            {% for endpoint in app.endpoints %}
              "{{ endpoint.name }}": "{{ endpoint.url }}"{% unless forloop.last %},{% endunless %}
            {% endfor %}
          }{% endif %}
        }
      `;

      const context = {
        app: {
          name: "MyApp",
          version: "1.0.0",
          debug: true,
          endpoints: [
            { name: "api", url: "https://api.example.com" },
            { name: "cdn", url: "https://cdn.example.com" },
          ],
        },
      };

      const result = await Effect.runPromise(render(template, context));

      expect(result).toContain('"name": "MyApp"');
      expect(result).toContain('"version": "1.0.0"');
      expect(result).toContain("https://api.example.com");
    });
  });

  describe("Notification template", () => {
    it("should render notification with severity levels", async () => {
      const template = `
        {% for notification in notifications %}
          <div class="notification notification-{{ notification.level }}">
            <h3>{{ notification.title | upcase }}</h3>
            <p>{{ notification.message }}</p>
            {% if notification.actionUrl %}
              <a href="{{ notification.actionUrl }}">{{ notification.actionText }}</a>
            {% endif %}
          </div>
        {% endfor %}
      `;

      const context = {
        notifications: [
          {
            level: "info",
            title: "Update available",
            message: "A new version is available.",
            actionUrl: "/update",
            actionText: "Update now",
          },
          {
            level: "warning",
            title: "Low disk space",
            message: "Your disk is running low.",
          },
          {
            level: "error",
            title: "Connection failed",
            message: "Cannot connect to server.",
          },
        ],
      };

      const result = await Effect.runPromise(render(template, context));

      expect(result).toContain("UPDATE AVAILABLE");
      expect(result).toContain("info");
      expect(result).toContain("warning");
      expect(result).toContain("error");
      expect(result).toContain("Update now");
    });
  });

  describe("Search results template", () => {
    it("should render search results with pagination info", async () => {
      const template = `
        <h1>Search Results for "{{ query }}"</h1>
        <p>Found {{ results | size }} results</p>

        {% if results %}
          <ul>
            {% for result in results limit: 10 %}
              <li>
                <a href="{{ result.url }}">{{ result.title }}</a>
                <p>{{ result.excerpt }}</p>
              </li>
            {% endfor %}
          </ul>

          {% if moreResults %}
            <p>
              Showing 1-{{ results | size }} of {{ totalResults }} results
              <a href="?page=2">Next Page</a>
            </p>
          {% endif %}
        {% else %}
          <p>No results found. Try a different search.</p>
        {% endif %}
      `;

      const context = {
        query: "liquid templates",
        results: [
          {
            url: "/article1",
            title: "Getting Started with Liquid",
            excerpt: "Learn the basics...",
          },
          {
            url: "/article2",
            title: "Advanced Liquid Patterns",
            excerpt: "Master the advanced features...",
          },
        ],
        totalResults: 42,
        moreResults: true,
      };

      const result = await Effect.runPromise(render(template, context));

      expect(result).toContain('Search Results for "liquid templates"');
      expect(result).toContain("Found 2 results");
      expect(result).toContain("Getting Started with Liquid");
      expect(result).toContain("Next Page");
    });
  });

  describe("Dashboard template", () => {
    it("should render dashboard with multiple sections and conditions", async () => {
      const template = `
        <div class="dashboard">
          {% if user.isAdmin %}
            <section class="admin-panel">
              <h2>Admin Controls</h2>
              <p>Total users: {{ stats.totalUsers }}</p>
            </section>
          {% endif %}

          <section class="user-section">
            <h2>Welcome, {{ user.name | capitalize }}!</h2>

            {% if user.tasks %}
              <div class="tasks">
                <h3>Your Tasks ({{ user.tasks | size }})</h3>
                {% for task in user.tasks %}
                  <div class="task">
                    <input type="checkbox" {% if task.completed %}checked{% endif %}>
                    <span>{{ task.title }}</span>
                  </div>
                {% endfor %}
              </div>
            {% endif %}

            {% unless user.isPremium %}
              <div class="upgrade-banner">
                Upgrade to premium for more features!
              </div>
            {% endunless %}
          </section>
        </div>
      `;

      const context = {
        user: {
          name: "alice",
          isAdmin: true,
          isPremium: false,
          tasks: [
            { title: "Complete project", completed: false },
            { title: "Review code", completed: true },
          ],
        },
        stats: {
          totalUsers: 1500,
        },
      };

      const result = await Effect.runPromise(render(template, context));

      expect(result).toContain("Welcome, Alice!");
      expect(result).toContain("Admin Controls");
      expect(result).toContain("Total users: 1500");
      expect(result).toContain("Your Tasks (2)");
      expect(result).toContain("Complete project");
      expect(result).toContain("Upgrade to premium");
    });
  });

  describe("Template compilation and reuse", () => {
    it("should compile complex template once and render multiple times", async () => {
      const template = `
        {% for user in users %}
          {{ user.name | capitalize }} ({{ user.email }})
        {% endfor %}
      `;

      const compiled = await Effect.runPromise(compile(template));

      const context1 = {
        users: [
          { name: "alice", email: "alice@example.com" },
          { name: "bob", email: "bob@example.com" },
        ],
      };

      const context2 = {
        users: [
          { name: "charlie", email: "charlie@example.com" },
          { name: "diana", email: "diana@example.com" },
        ],
      };

      const result1 = await Effect.runPromise(
        renderCompiled(compiled, context1)
      );
      const result2 = await Effect.runPromise(
        renderCompiled(compiled, context2)
      );

      expect(result1).toContain("Alice");
      expect(result1).toContain("alice@example.com");

      expect(result2).toContain("Charlie");
      expect(result2).toContain("charlie@example.com");

      // Results should be different
      expect(result1).not.toContain("Charlie");
      expect(result2).not.toContain("Alice");
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle e-commerce product card template", async () => {
      const template = `
        <div class="product-card">
          <img src="{{ product.image }}" alt="{{ product.name }}">
          <h3>{{ product.name }}</h3>

          {% if product.rating %}
            <div class="rating">★ {{ product.rating }}/5</div>
          {% endif %}

          <p class="price">
            {% if product.onSale %}
              <span class="original">${{ product.originalPrice }}</span>
              <span class="sale">${{ product.price }}</span>
            {% else %}
              ${{ product.price }}
            {% endif %}
          </p>

          <div class="tags">
            {% for tag in product.tags %}
              <span class="tag">{{ tag | capitalize }}</span>
            {% endfor %}
          </div>

          {% if product.inStock %}
            <button>Add to Cart</button>
          {% else %}
            <p class="out-of-stock">Out of Stock</p>
          {% endif %}
        </div>
      `

      const context = {
        product: {
          name: "awesome headphones",
          image: "/images/headphones.jpg",
          price: 99.99,
          originalPrice: 149.99,
          onSale: true,
          rating: 4.5,
          inStock: true,
          tags: ["audio", "wireless", "premium"],
        },
      };

      const result = await Effect.runPromise(render(template, context));

      expect(result).toContain("Awesome Headphones");
      expect(result).toContain("$99.99");
      expect(result).toContain("$149.99");
      expect(result).toContain("★ 4.5/5");
      expect(result).toContain("Audio");
      expect(result).toContain("Add to Cart");
      expect(result).not.toContain("Out of Stock");
    });
  });
});
