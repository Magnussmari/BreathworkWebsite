import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const registerSchema = z.object({
  email: z.string().email("Ógilt netfang"),
  password: z.string().min(6, "Lykilorð verður að vera að minnsta kosti 6 stafir"),
  firstName: z.string().min(1, "Fornafn vantar"),
  lastName: z.string().min(1, "Eftirnafn vantar"),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Aðgangur búinn til!",
        description: "Velkomin í Breathwork. Þú ert nú skráð/ur inn.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Skráning mistókst",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M8 12 Q12 8 16 12 Q12 16 8 12" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Búa til aðgang</CardTitle>
          <CardDescription className="text-center">
            Byrjaðu breathwork ferðina þína með Breathwork
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornafn</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jón"
                          {...field}
                          disabled={registerMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eftirnafn</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jónsson"
                          {...field}
                          disabled={registerMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Netfang</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="þitt@netfang.is"
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Símanúmer (valfrjálst)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+354 123 4567"
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lykilorð</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Að minnsta kosti 6 stafir"
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Bý til aðgang..." : "Búa til aðgang"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Ertu nú þegar með aðgang? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              Skráðu þig inn hér
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
