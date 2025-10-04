import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Um okkur
          </h1>
          <p className="text-xl text-muted-foreground">
            Breathwork - Öndunaræfingar í hjarta Íslands
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardContent className="p-8">
              <h2 className="font-serif text-2xl font-bold mb-4">Okkar saga</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="font-serif text-2xl font-bold mb-4">Okkar hlutverk</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="font-serif text-2xl font-bold mb-4">Gildi okkar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Fagmennska</h3>
                  <p className="text-muted-foreground">
                    At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Traust</h3>
                  <p className="text-muted-foreground">
                    Quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Umhyggja</h3>
                  <p className="text-muted-foreground">
                    Qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Nýsköpun</h3>
                  <p className="text-muted-foreground">
                    Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="font-serif text-2xl font-bold mb-4">Hafðu samband</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Netfang:</strong> info@breathwork.is</p>
                <p><strong>Símanúmer:</strong> +354 123 4567</p>
                <p><strong>Staðsetning:</strong> Reykjavík, Ísland</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
