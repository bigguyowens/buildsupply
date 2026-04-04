import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signToken } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  // Look up the token
  const rows = await query<{
    id: number;
    target_user_id: number;
    created_by: number;
    expires_at: string;
    used_at: string | null;
    creator_first: string;
    creator_last: string;
    creator_role: string;
  }>(
    `SELECT t.id, t.target_user_id, t.created_by, t.expires_at, t.used_at,
            u.first_name AS creator_first, u.last_name AS creator_last, u.role AS creator_role
     FROM impersonation_tokens t
     JOIN users u ON u.id = t.created_by
     WHERE t.token = $1`,
    [token]
  );

  if (!rows.length) {
    return new NextResponse("Invalid or expired impersonation link", { status: 403 });
  }

  const row = rows[0];
  if (row.used_at) {
    return new NextResponse("This impersonation link has already been used", { status: 403 });
  }
  if (new Date(row.expires_at) < new Date()) {
    return new NextResponse("This impersonation link has expired (15 min limit)", { status: 403 });
  }

  // Get the target customer
  const customers = await query<{
    id: number; email: string;
    first_name: string; last_name: string; role: string;
  }>(
    `SELECT id, email, first_name, last_name, role FROM users WHERE id = $1`,
    [row.target_user_id]
  );
  if (!customers.length) {
    return new NextResponse("Customer not found", { status: 404 });
  }
  const customer = customers[0];

  // Mark token as used
  await query(`UPDATE impersonation_tokens SET used_at = NOW() WHERE id = $1`, [row.id]);

  // Log the impersonation
  const logRow = await query<{ id: number }>(
    `INSERT INTO impersonation_log
       (target_user_id, target_name, impersonated_by, impersonator_name)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [
      customer.id,
      `${customer.first_name} ${customer.last_name}`,
      row.created_by,
      `${row.creator_first} ${row.creator_last}`,
    ]
  );
  const logId = logRow[0].id;

  // Build customer session JWT
  const customerSession: SessionUser = {
    id:        customer.id,
    email:     customer.email,
    firstName: customer.first_name,
    lastName:  customer.last_name,
    role:      customer.role,
  };
  const customerToken = signToken(customerSession);

  // Build impersonator context to store in separate cookie
  const impersonatorCtx = JSON.stringify({
    impersonatorId:    row.created_by,
    impersonatorName:  `${row.creator_first} ${row.creator_last}`,
    impersonatorRole:  row.creator_role,
    targetUserId:      customer.id,
    targetName:        `${customer.first_name} ${customer.last_name}`,
    logId,
    returnUrl:         `/crm/customers/${customer.id}`,
  });

  const res = NextResponse.redirect(new URL("/account", req.url));

  // Set customer session
  res.cookies.set("bs_token", customerToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 30, // 30 minute max impersonation session
    path: "/",
  });

  // Set impersonation context (NOT httpOnly so client banner can read it)
  res.cookies.set("bs_impersonating", impersonatorCtx, {
    httpOnly: false, // Intentionally readable by client for banner display
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 30,
    path: "/",
  });

  return res;
}
