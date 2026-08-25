package service

import "testing"

func TestSlugifyRussianName(t *testing.T) {
	got := slugify("Блин с мёдом!")
	if got != "blin-s-medom" {
		t.Fatalf("slugify() = %q, want %q", got, "blin-s-medom")
	}
}

func TestDefaultImageByCategory(t *testing.T) {
	cases := map[string]string{
		"pancakes":  "pancake-folded",
		"breakfast": "breakfast",
		"drinks":    "coffee",
		"":          "breakfast",
	}

	for category, want := range cases {
		if got := defaultImage(category); got != want {
			t.Fatalf("defaultImage(%q) = %q, want %q", category, got, want)
		}
	}
}
