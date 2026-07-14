"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

type ClientItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  convertedAt: Date;
  brokerName: string | null;
};

export function ClientesList({ clients }: { clients: ClientItem[] }) {
  if (clients.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
        className="p-10 text-center text-sm text-muted-foreground"
      >
        Nenhum cliente convertido ainda.
      </motion.p>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
      }}
      className="divide-y divide-border"
    >
      {clients.map((client) => (
        <motion.div
          key={client.id}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0, 0, 0.2, 1] } },
          }}
          whileHover={{ x: 4, backgroundColor: "var(--sidebar-accent)", transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } }}
          className="group/card flex cursor-default flex-col gap-2 px-5 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium transition-colors duration-200 group-hover/card:text-foreground">{client.name}</p>
            <p className="text-xs text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground/70">{client.email ?? client.phone}</p>
          </div>
          <div className="text-left sm:text-right">
            <Badge variant="outline" className="transition-all duration-200 group-hover/card:border-primary/30 group-hover/card:text-foreground">Cliente ativo</Badge>
            <p className="mt-1 text-xs text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground/70">
              Convertido em {new Intl.DateTimeFormat("pt-BR").format(client.convertedAt)}
              {client.brokerName ? ` · ${client.brokerName}` : ""}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
