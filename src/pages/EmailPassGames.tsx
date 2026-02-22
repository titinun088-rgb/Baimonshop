import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAllGames } from '@/lib/emailPassGameUtils';
import { EmailPassGame } from '@/types/emailPassGame';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function EmailPassGames() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [games, setGames] = useState<EmailPassGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      const data = await getAllGames(true); // แสดงเฉพาะ active
      setGames(data);
    } catch (error) {
      console.error('Error loading games:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดรายการเกมได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGameClick = (game: EmailPassGame) => {
    if (!user) {
      toast({
        title: 'กรุณาเข้าสู่ระบบ',
        description: 'กรุณาเข้าสู่ระบบก่อนทำรายการ',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    navigate(`/email-pass-games/${game.id}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">เติมเกมด้วย Email & Password</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          เลือกเกมที่ต้องการเติม ใส่อีเมลและรหัสผ่าน แล้วรอแอดมินเติมให้
        </p>
      </div>

      {games.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">ยังไม่มีเกมให้บริการ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {games.map((game) => (
            <Card
              key={game.id}
              className="cursor-pointer hover:shadow-lg transition-all active:scale-95 md:hover:scale-105"
              onClick={() => handleGameClick(game)}
            >
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="text-3xl md:text-4xl">{game.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl">{game.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {game.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>เติมด้วย Email & Password</span>
                  <span className="text-primary font-medium">เลือก →</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </Layout>
  );
}
