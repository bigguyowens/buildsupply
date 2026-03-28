'use server';

import { query } from "@/lib/db";

// ── Quote follow-up task automation ────────────────────────────────────────
export async function createQuoteFollowUpTasks(
  quoteId: number,
  expiresAt: string,
  customerId: number,
  customerName: string,
  createdBy: number
): Promise<void> {
  try {
    const expiry = new Date(expiresAt);
    const now    = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) return; // Already expired — no tasks

    // Find the AM assigned to this customer, fall back to createdBy
    const amRows = await query<{ account_manager_id: number | null }>(
      `SELECT account_manager_id FROM users WHERE id = $1`,
      [customerId]
    );
    const assignedTo = amRows[0]?.account_manager_id ?? createdBy;

    // Build the milestone schedule
    type Milestone = {
      daysBeforeExpiry: number;
      tasks: { type: "email" | "call"; title: string; description: string }[];
    };

    const allMilestones: Milestone[] = [
      {
        daysBeforeExpiry: 90,
        tasks: [{
          type:        "email",
          title:       `📧 Quote #${quoteId} — 90-day follow-up email`,
          description: `Send a check-in email to ${customerName} about Quote #${quoteId}. Confirm they have everything they need and address any questions.`,
        }],
      },
      {
        daysBeforeExpiry: 60,
        tasks: [{
          type:        "email",
          title:       `📧 Quote #${quoteId} — 60-day follow-up email`,
          description: `Send a follow-up email to ${customerName} about Quote #${quoteId}. Remind them the quote is still active and offer assistance.`,
        }],
      },
      {
        daysBeforeExpiry: 30,
        tasks: [
          {
            type:        "email",
            title:       `📧 Quote #${quoteId} — 30-day reminder email`,
            description: `Send a 30-day reminder email to ${customerName} about Quote #${quoteId}. Highlight the expiration date and encourage a decision.`,
          },
          {
            type:        "call",
            title:       `📞 Quote #${quoteId} — 30-day follow-up call`,
            description: `Call ${customerName} about Quote #${quoteId}. Discuss any concerns, negotiate if needed, and aim to close.`,
          },
        ],
      },
      {
        daysBeforeExpiry: 15,
        tasks: [{
          type:        "call",
          title:       `📞 Quote #${quoteId} — 15-day urgent call`,
          description: `Call ${customerName} urgently about Quote #${quoteId}. Only 15 days remain — push for a decision or extension.`,
        }],
      },
      {
        daysBeforeExpiry: 5,
        tasks: [{
          type:        "call",
          title:       `📞 Quote #${quoteId} — Final call (5 days left)`,
          description: `Final call to ${customerName} about Quote #${quoteId}. Quote expires in 5 days — last chance to close or renew.`,
        }],
      },
    ];

    // Only create tasks for milestones that haven't already passed
    const applicableMilestones = allMilestones.filter(
      m => m.daysBeforeExpiry < daysUntilExpiry
    );

    for (const milestone of applicableMilestones) {
      const dueDate = new Date(expiry);
      dueDate.setDate(dueDate.getDate() - milestone.daysBeforeExpiry);
      const dueDateStr = dueDate.toISOString().split("T")[0];

      for (const task of milestone.tasks) {
        await query(
          `INSERT INTO crm_tasks
             (title, description, type, priority, due_date,
              entity_type, entity_id, entity_name,
              assigned_to, created_by)
           VALUES ($1,$2,$3,$4,$5,'customer',$6,$7,$8,$9)`,
          [
            task.title,
            task.description,
            task.type === "email" ? "email" : "call",
            milestone.daysBeforeExpiry <= 15 ? "high" : milestone.daysBeforeExpiry <= 30 ? "medium" : "low",
            dueDateStr,
            customerId,
            customerName,
            assignedTo,
            createdBy,
          ]
        );
      }
    }

    console.log(
      `[Quote #${quoteId}] Created ${applicableMilestones.reduce((s, m) => s + m.tasks.length, 0)} follow-up tasks ` +
      `(${daysUntilExpiry} days until expiry, ${applicableMilestones.length} milestones)`
    );
  } catch (err) {
    // Non-fatal — log but don't break the quote send
    console.error(`[Quote #${quoteId}] Failed to create follow-up tasks:`, err);
  }
}
