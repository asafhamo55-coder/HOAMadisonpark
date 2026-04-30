"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import type { WorkspaceMembership } from "@/lib/hub/workspace"
import { setActiveWorkspaceAction } from "@/app/actions/hub"

export function WorkspaceSwitcher({
  workspaces,
  active,
}: {
  workspaces: WorkspaceMembership[]
  active: WorkspaceMembership
}) {
  const [pending, start] = useTransition()
  const router = useRouter()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-between">
          <span className="truncate">{active.name}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="end">
        <Command>
          <CommandList>
            <CommandGroup heading="Your workspaces">
              {workspaces.map((w) => (
                <CommandItem
                  key={w.id}
                  disabled={pending}
                  onSelect={() => {
                    start(async () => {
                      await setActiveWorkspaceAction(w.slug)
                      router.refresh()
                    })
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${w.slug === active.slug ? "opacity-100" : "opacity-0"}`}
                  />
                  <span className="truncate">{w.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
