import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Hero background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-10"></div>
        
        {/* Serene meditation/breathwork scene with soft natural light */}
        <img 
          src="https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=800" 
          alt="Peaceful breathwork session in nature" 
          className="absolute inset-0 w-full h-full object-cover opacity-20" 
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            {/* Logo and Title */}
            <div className="flex items-center justify-center space-x-2 mb-6" data-testid="logo">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M8 12 Q12 8 16 12 Q12 16 8 12" strokeWidth="2" fill="none"/>
              </svg>
              <span className="font-serif text-3xl font-bold text-foreground">Breathwork</span>
            </div>
            
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6" data-testid="hero-title">
              Andaðu. Umbreyttu. Blómstraðu.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="hero-description">
              Upplifðu lækningarmátt öndunaræfinga í hjarta Íslands. Löggildir leiðbeinendur okkar leiða þig í gegnum umbreytandi tíma sem eru hannaðir til að draga úr streitu, auka orku og opna á fulla möguleika þína.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="px-8 py-4 text-lg font-semibold"
                data-testid="button-login"
              >
                <Link href="/login">Skráðu þig inn til að bóka tíma</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold"
                data-testid="button-learn-more"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Lesa meira
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Services */}
      <div id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4" data-testid="services-title">
            Vinsælir tímar
          </h2>
          <p className="text-lg text-muted-foreground" data-testid="services-description">
            Finndu öndunaræfingarnar sem henta þér best
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Service Card 1 */}
          <Card className="hover:shadow-xl transition-all" data-testid="card-service-intro">
            <img 
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
              alt="Introductory breathwork session" 
              className="w-full h-48 object-cover rounded-t-lg" 
            />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Byrjendavænt
                </span>
                <span className="text-2xl font-bold text-foreground" data-testid="price-intro">4,500 ISK</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-3">Kynning á öndunaræfingum</h3>
              <p className="text-muted-foreground mb-4">
                Fullkomið fyrir byrjendur. Lærðu grunnöndunartækni til að draga úr streitu og auka vellíðan. 60 mínútna tími inniheldur leiðbeinda æfingu og spurningar og svör.
              </p>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                60 mínútur
              </div>
              <Button
                asChild
                className="w-full"
                data-testid="button-book-intro"
              >
                <Link href="/login">Skráðu þig inn til að bóka</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Service Card 2 */}
          <Card className="hover:shadow-xl transition-all" data-testid="card-service-healing">
            <img 
              src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
              alt="Deep healing breathwork session" 
              className="w-full h-48 object-cover rounded-t-lg" 
            />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-block bg-accent/20 text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Vinsælast
                </span>
                <span className="text-2xl font-bold text-foreground" data-testid="price-healing">7,900 ISK</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-3">Djúp lækningaröndun</h3>
              <p className="text-muted-foreground mb-4">
                Umbreytandi 90 mínútna ferð með meðvitaðri tengdri öndun til að losa um tilfinningalegar hindranir og endurheimta jafnvægi. Upplifðu djúpa lækningu.
              </p>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                90 mínútur
              </div>
              <Button
                asChild
                className="w-full"
                data-testid="button-book-healing"
              >
                <Link href="/login">Skráðu þig inn til að bóka</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Service Card 3 */}
          <Card className="hover:shadow-xl transition-all" data-testid="card-service-private">
            <img 
              src="https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
              alt="Private one-on-one breathwork" 
              className="w-full h-48 object-cover rounded-t-lg" 
            />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Hágæða
                </span>
                <span className="text-2xl font-bold text-foreground" data-testid="price-private">12,500 ISK</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-3">Einkatími einn-á-einn</h3>
              <p className="text-muted-foreground mb-4">
                Persónulegur öndunaræfingatími sniðinn að þínum sérstöku þörfum. Inniheldur heilsumat, sérsniðið val á tækni og leiðbeiningar um samþættingu eftir tíma.
              </p>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                90 mínútur
              </div>
              <Button
                asChild
                className="w-full"
                data-testid="button-book-private"
              >
                <Link href="/login">Skráðu þig inn til að bóka</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-card py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4" data-testid="benefits-title">
              Af hverju öndunaræfingar?
            </h2>
            <p className="text-lg text-muted-foreground" data-testid="benefits-description">
              Vísindalega sannaður ávinningur fyrir huga og líkama
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center" data-testid="benefit-stress">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Minni streita</h3>
              <p className="text-muted-foreground">Lækka cortisol gildi og virkja parasympathetic taugakerfið</p>
            </div>

            <div className="text-center" data-testid="benefit-energy">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Meiri orka</h3>
              <p className="text-muted-foreground">Auka súrefnismettun frumna og lífsorku með meðvitaðri öndun</p>
            </div>

            <div className="text-center" data-testid="benefit-clarity">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Hugarskýring</h3>
              <p className="text-muted-foreground">Bæta einbeitingu, ákvarðanatöku og vitsmunaframmistöðu</p>
            </div>

            <div className="text-center" data-testid="benefit-release">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Tilfinningaleg losun</h3>
              <p className="text-muted-foreground">Vinna úr áfalli og losa um geymd tilfinningaleg spennutímabil á öruggan hátt</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-accent py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary-foreground mb-4" data-testid="cta-title">
            Tilbúin/n að hefja ferðina?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto" data-testid="cta-description">
            Vertu með hundruðum Íslendinga sem hafa umbreytt lífi sínu með öndunaræfingum. Skráðu þig inn til að bóka þinn fyrsta tíma í dag og upplifðu muninn.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="px-8 py-4 text-lg font-semibold"
            data-testid="button-login-cta"
          >
            <Link href="/login">Skráðu þig inn til að bóka þinn fyrsta tíma</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
