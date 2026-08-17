"use client";

import { useEffect, useState } from "react";
import { FolderPlus, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWordsStore } from "@/lib/stores/words-store";
import type { FolderTabId } from "@/lib/types";

export default function DictionaryTabs() {
  const folders = useWordsStore((state) => state.folders);
  const selectedTabId = useWordsStore((state) => state.selectedTabId);
  const isFoldersLoading = useWordsStore((state) => state.isFoldersLoading);
  const fetchFolders = useWordsStore((state) => state.fetchFolders);
  const setSelectedTabId = useWordsStore((state) => state.setSelectedTabId);
  const createFolder = useWordsStore((state) => state.createFolder);
  const renameFolder = useWordsStore((state) => state.renameFolder);
  const deleteFolder = useWordsStore((state) => state.deleteFolder);

  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void fetchFolders();
  }, [fetchFolders]);

  const selectedFolder = folders.find((folder) => folder.id === selectedTabId);
  const canManageSelected = Boolean(selectedFolder);

  async function handleCreate() {
    const name = folderName.trim();
    if (!name) {
      return;
    }

    setIsSaving(true);
    const folder = await createFolder(name);
    setIsSaving(false);

    if (folder) {
      toast.success(`Created “${folder.name}”.`);
      setCreateOpen(false);
      setFolderName("");
    } else {
      toast.error("Could not create folder.");
    }
  }

  async function handleRename() {
    if (!selectedFolder) {
      return;
    }

    const name = folderName.trim();
    if (!name) {
      return;
    }

    setIsSaving(true);
    const folder = await renameFolder(selectedFolder.id, name);
    setIsSaving(false);

    if (folder) {
      toast.success(`Renamed to “${folder.name}”.`);
      setRenameOpen(false);
      setFolderName("");
    } else {
      toast.error("Could not rename folder.");
    }
  }

  async function handleDelete() {
    if (!selectedFolder) {
      return;
    }

    setIsSaving(true);
    const deleted = await deleteFolder(selectedFolder.id);
    setIsSaving(false);

    if (deleted) {
      toast.success(
        `Deleted “${selectedFolder.name}”. Words moved to Unsorted.`,
      );
      setDeleteOpen(false);
    } else {
      toast.error("Could not delete folder.");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {isFoldersLoading ? (
          <Skeleton className="h-8 w-64 rounded-lg" />
        ) : (
          <Tabs
            value={selectedTabId}
            onValueChange={(value) => setSelectedTabId(value as FolderTabId)}
            className="min-w-0 flex-1"
          >
            <TabsList className="grid h-auto w-full max-w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start">
              <TabsTrigger value="all" className="flex-none">
                All
              </TabsTrigger>
              <div className="flex min-w-0 flex-wrap justify-start">
                {folders.map((folder) => (
                  <TabsTrigger
                    key={folder.id}
                    value={folder.id}
                    className="flex-none"
                  >
                    {folder.name}
                  </TabsTrigger>
                ))}
              </div>
              <TabsTrigger value="finished" className="flex-none">
                Finished
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {canManageSelected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <MoreHorizontal data-icon="inline-start" />
                  Folder
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onSelect={() => {
                    setFolderName(selectedFolder?.name ?? "");
                    setRenameOpen(true);
                  }}
                >
                  <Pencil />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFolderName("");
              setCreateOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
            New folder
          </Button>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Group saved words into a named folder.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Folder name"
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreate();
              }
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreate()}
              disabled={isSaving || !folderName.trim()}
            >
              <FolderPlus data-icon="inline-start" />
              {isSaving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
            <DialogDescription>
              Update the name for “{selectedFolder?.name}”.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Folder name"
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleRename();
              }
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleRename()}
              disabled={isSaving || !folderName.trim()}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{selectedFolder?.name}”?</DialogTitle>
            <DialogDescription>
              Words in this folder will move back to Unsorted. The words
              themselves are not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={isSaving}
            >
              {isSaving ? "Deleting…" : "Delete folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
