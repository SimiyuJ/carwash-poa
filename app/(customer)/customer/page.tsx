"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setCustomers(data || []);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Customers</h1>

      {customers.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{c.full_name}</p>
              <p className="text-sm text-gray-500">{c.email}</p>
            </div>

            <Button onClick={() => router.push(`/customer-profiles/${c.id}`)}>
              View
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}