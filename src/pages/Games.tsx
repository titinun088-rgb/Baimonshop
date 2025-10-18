import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockGames = [
  {
    id: 1,
    name: "Valorant",
    category: "FPS",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop",
    items: 12,
  },
  {
    id: 2,
    name: "Genshin Impact",
    category: "RPG",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
    items: 8,
  },
  {
    id: 3,
    name: "Mobile Legends",
    category: "MOBA",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop",
    items: 15,
  },
  {
    id: 4,
    name: "Free Fire",
    category: "Battle Royale",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop",
    items: 20,
  },
];

const Games = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">จัดการเกม</h1>
            <p className="text-muted-foreground">
              เพิ่มและจัดการเกมและรายการเติมเงิน
            </p>
          </div>
          <Button className="bg-gradient-primary shadow-glow">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มเกมใหม่
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเกม..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Games Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockGames.map((game) => (
            <Card
              key={game.id}
              className="group overflow-hidden border-border bg-card shadow-card transition-all hover:shadow-glow"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={game.image}
                  alt={game.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                  <div>
                    <h3 className="font-semibold">{game.name}</h3>
                    <p className="text-xs text-muted-foreground">{game.category}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>ดูรายละเอียด</DropdownMenuItem>
                      <DropdownMenuItem>แก้ไข</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        ลบ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">รายการเติมเงิน</span>
                  <span className="font-semibold">{game.items} รายการ</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Games;
