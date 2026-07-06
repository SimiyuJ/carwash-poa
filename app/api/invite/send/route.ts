import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

/* =========================================
   ENV VALIDATION
========================================= */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const resendApiKey = process.env.RESEND_API_KEY;

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
}

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is missing");
}

/* =========================================
   SERVER CLIENTS
========================================= */
const supabase = createClient(supabaseUrl, serviceRoleKey);

const resend = new Resend(resendApiKey);

/* =========================================
   EMAIL VALIDATION
========================================= */
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================================
   SEND INVITE API
========================================= */
export async function POST(req: Request) {
  try {
    /* =========================================
       PARSE BODY
    ========================================= */
    const body = await req.json();

    const { email, carwash_id, branch_id, role } = body;

    /* =========================================
       VALIDATION
    ========================================= */
    if (!email || !role) {
      return NextResponse.json(
        {
          error: "Email and role are required",
        },
        {
          status: 400,
        },
      );
    }

    if (!carwash_id) {
      return NextResponse.json(
        {
          error: "Missing carwash_id",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: "Invalid email address",
        },
        {
          status: 400,
        },
      );
    }

    /* =========================================
       NORMALIZE EMAIL
    ========================================= */
    const normalizedEmail = email.toLowerCase().trim();

    /* =========================================
       CHECK EXISTING INVITE
    ========================================= */
    const { data: existingInvite } = await supabase
      .from("invites")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        {
          error: "User already has a pending invite",
        },
        {
          status: 400,
        },
      );
    }

    /* =========================================
       GENERATE TOKEN
    ========================================= */
    const token = crypto.randomUUID();

    /* =========================================
       INSERT INVITE
    ========================================= */
    const { data: invite, error: insertError } = await supabase
      .from("invites")
      .insert([
        {
          email: normalizedEmail,

          role,

          token,

          used: false,

          carwash_id,

          branch_id: branch_id || null,
        },
      ])
      .select()
      .single();

    /* =========================================
       INSERT ERROR
    ========================================= */
    if (insertError) {
      console.error("INVITE INSERT ERROR:", insertError);

      return NextResponse.json(
        {
          error: insertError.message,

          details: insertError.details,

          hint: insertError.hint,
        },
        {
          status: 500,
        },
      );
    }

    /* =========================================
       INVITE LINK
    ========================================= */
    const inviteLink = `${appUrl}/admin/accept-invite/${token}`;

    /* =========================================
       SEND EMAIL
    ========================================= */
    const emailResponse = await resend.emails.send({
      from: "Carwash SaaS <onboarding@resend.dev>",

      to: normalizedEmail,

      subject: "You're invited to join Carwash SaaS",

      html: `
          <div style="
            font-family: Arial, sans-serif;
            padding: 30px;
            background: #0f172a;
            color: white;
          ">

            <h1 style="
              color: #22c55e;
              margin-bottom: 20px;
            ">
              Carwash Staff Invitation
            </h1>

            <p>
              You have been invited to join the carwash workspace as:
            </p>

            <div style="
              margin: 20px 0;
              padding: 12px 18px;
              background: #1e293b;
              border-radius: 10px;
              display: inline-block;
              font-weight: bold;
              color: #4ade80;
            ">
              ${role.toUpperCase()}
            </div>

            <p style="margin-top:20px;">
              Click the button below to accept your invitation:
            </p>

            <a
              href="${inviteLink}"
              style="
                display:inline-block;
                margin-top:20px;
                background:#16a34a;
                color:white;
                padding:14px 24px;
                border-radius:12px;
                text-decoration:none;
                font-weight:bold;
              "
            >
              Accept Invitation
            </a>

            <p style="
              margin-top:30px;
              color:#94a3b8;
              font-size:14px;
            ">
              If the button doesn't work,
              copy and paste this link:
            </p>

            <p style="
              color:#4ade80;
              word-break:break-all;
            ">
              ${inviteLink}
            </p>

          </div>
        `,
    });

    /* =========================================
       SUCCESS RESPONSE
    ========================================= */
    return NextResponse.json({
      success: true,

      message: "Invite created and email sent successfully",

      invite,

      inviteLink,

      emailResponse,
    });
  } catch (err: any) {
    console.error("INVITE API CRASH:", err);

    return NextResponse.json(
      {
        error: "Internal Server Error",

        message: err?.message || "Unknown server error",
      },
      {
        status: 500,
      },
    );
  }
}
