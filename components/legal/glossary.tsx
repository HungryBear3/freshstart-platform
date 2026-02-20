"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

interface GlossaryTerm {
  term: string
  definition: string
  category?: string
}

interface GlossaryProps {
  terms: GlossaryTerm[]
  className?: string
}

export function Glossary({ terms, className }: GlossaryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(
    new Set(terms.map((t) => t.category).filter((c): c is string => Boolean(c)))
  )

  const filteredTerms = terms.filter((term) => {
    const matchesSearch =
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || term.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Group terms alphabetically
  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const firstLetter = term.term[0].toUpperCase()
    if (!acc[firstLetter]) {
      acc[firstLetter] = []
    }
    acc[firstLetter].push(term)
    return acc
  }, {} as Record<string, GlossaryTerm[]>)

  const sortedLetters = Object.keys(groupedTerms).sort()

  return (
    <div className={className}>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search legal terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                selectedCategory === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-md px-3 py-1 text-sm transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredTerms.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No terms found matching your search.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedLetters.map((letter) => (
            <div key={letter}>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">{letter}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {groupedTerms[letter]
                  .sort((a, b) => a.term.localeCompare(b.term))
                  .map((term, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{term.term}</CardTitle>
                        {term.category && (
                          <CardDescription className="text-xs uppercase">
                            {term.category}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{term.definition}</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
