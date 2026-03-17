"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResidentsTab } from "./tabs/residents-tab"
import { ViolationsTab } from "./tabs/violations-tab"
import { LettersTab } from "./tabs/letters-tab"
import { PaymentsTab } from "./tabs/payments-tab"
import { NotesTab } from "./tabs/notes-tab"
import { SidebarPanel } from "./sidebar-panel"
import type { PropertyDetail } from "./detail-data"

export function PropertyDetailView({
  data,
  canManage,
}: {
  data: PropertyDetail
  canManage: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Back link + Title */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/properties">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold">{data.property.address}</h2>
          {data.property.unit && (
            <p className="text-sm text-muted-foreground">
              Unit {data.property.unit}
            </p>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Tabs */}
        <div className="min-w-0 flex-1">
          <Tabs defaultValue="residents">
            <TabsList className="w-full flex-wrap h-auto gap-1">
              <TabsTrigger value="residents">Residents</TabsTrigger>
              <TabsTrigger value="violations">
                Violations
                {data.violations.filter(
                  (v) => !["resolved", "dismissed"].includes(v.status)
                ).length > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {
                      data.violations.filter(
                        (v) =>
                          !["resolved", "dismissed"].includes(v.status)
                      ).length
                    }
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="letters">Letters</TabsTrigger>
              <TabsTrigger value="payments">
                Payments
                {data.payments.filter((p) => p.status === "overdue").length >
                  0 && (
                  <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {
                      data.payments.filter((p) => p.status === "overdue")
                        .length
                    }
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="notes">Notes & Docs</TabsTrigger>
            </TabsList>

            <TabsContent value="residents" className="mt-4">
              <ResidentsTab
                propertyId={data.property.id}
                currentResidents={data.currentResidents}
                formerResidents={data.formerResidents}
                canManage={canManage}
              />
            </TabsContent>

            <TabsContent value="violations" className="mt-4">
              <ViolationsTab
                propertyId={data.property.id}
                violations={data.violations}
                canManage={canManage}
              />
            </TabsContent>

            <TabsContent value="letters" className="mt-4">
              <LettersTab
                propertyId={data.property.id}
                propertyAddress={data.property.address}
                letters={data.letters}
                residents={data.currentResidents}
                violations={data.violations}
                canManage={canManage}
              />
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <PaymentsTab
                propertyId={data.property.id}
                payments={data.payments}
                residents={data.currentResidents}
                canManage={canManage}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <NotesTab
                propertyId={data.property.id}
                notes={data.property.notes}
                canManage={canManage}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Sidebar */}
        <div className="w-full shrink-0 lg:w-72 xl:w-80">
          <SidebarPanel data={data} canManage={canManage} />
        </div>
      </div>
    </div>
  )
}
