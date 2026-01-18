-- Seed grammar topics for A1.2 to B1 curriculum
-- Based on Goethe-Institut B1 exam requirements

INSERT INTO grammar_topics (slug, name_de, name_en, level, description_de, description_en, order_index, weight) VALUES

-- A1 Level (Foundation - should be mostly known)
('present_tense', 'Prasens', 'Present Tense', 'A1',
 'Verben im Prasens konjugieren',
 'Conjugating verbs in present tense', 1, 0.5),

('sein_haben', 'sein und haben', 'sein and haben', 'A1',
 'Die Verben sein und haben richtig benutzen',
 'Using sein and haben correctly', 2, 0.5),

('articles_basic', 'Artikel (der, die, das)', 'Articles', 'A1',
 'Bestimmte und unbestimmte Artikel',
 'Definite and indefinite articles', 3, 0.6),

('nominative_accusative', 'Nominativ und Akkusativ', 'Nominative and Accusative', 'A1',
 'Die Falle Nominativ und Akkusativ',
 'Nominative and accusative cases', 4, 0.7),

('negation', 'Verneinung (nicht, kein)', 'Negation', 'A1',
 'Satze verneinen mit nicht und kein',
 'Negating sentences with nicht and kein', 5, 0.5),

('word_order_basic', 'Wortstellung (Aussagesatz)', 'Basic Word Order', 'A1',
 'Subjekt-Verb-Objekt Struktur',
 'Subject-Verb-Object structure', 6, 0.6),

('yes_no_questions', 'Ja/Nein-Fragen', 'Yes/No Questions', 'A1',
 'Fragen mit Ja oder Nein beantworten',
 'Questions answered with yes or no', 7, 0.5),

('w_questions', 'W-Fragen', 'W-Questions', 'A1',
 'Fragen mit wer, was, wo, wann, wie, warum',
 'Questions with who, what, where, when, how, why', 8, 0.5),

-- A2 Level (Building blocks)
('dative_case', 'Dativ', 'Dative Case', 'A2',
 'Der Dativ und Dativprapositionen',
 'Dative case and dative prepositions', 10, 0.8),

('two_way_prepositions', 'Wechselprapositionen', 'Two-way Prepositions', 'A2',
 'Prapositionen mit Dativ oder Akkusativ',
 'Prepositions with dative or accusative', 11, 0.9),

('modal_verbs', 'Modalverben', 'Modal Verbs', 'A2',
 'konnen, mussen, wollen, sollen, durfen, mogen',
 'can, must, want, should, may, like', 12, 0.9),

('perfekt_haben', 'Perfekt mit haben', 'Perfect with haben', 'A2',
 'Vergangenheit mit haben bilden',
 'Past tense with haben', 13, 1.0),

('perfekt_sein', 'Perfekt mit sein', 'Perfect with sein', 'A2',
 'Vergangenheit mit sein bilden',
 'Past tense with sein', 14, 1.0),

('separable_verbs', 'Trennbare Verben', 'Separable Verbs', 'A2',
 'Verben die sich trennen: anfangen, aufstehen...',
 'Verbs that separate: anfangen, aufstehen...', 15, 0.8),

('reflexive_verbs', 'Reflexive Verben', 'Reflexive Verbs', 'A2',
 'sich waschen, sich freuen, sich erinnern',
 'Verbs with reflexive pronouns', 16, 0.8),

('comparative', 'Komparativ', 'Comparative', 'A2',
 'Vergleiche: grosser, kleiner, besser',
 'Comparisons: bigger, smaller, better', 17, 0.7),

('superlative', 'Superlativ', 'Superlative', 'A2',
 'am grossten, am kleinsten, am besten',
 'the biggest, smallest, best', 18, 0.7),

('imperative', 'Imperativ', 'Imperative', 'A2',
 'Befehle und Bitten: Komm! Gehen Sie!',
 'Commands and requests', 19, 0.6),

('possessive_pronouns', 'Possessivpronomen', 'Possessive Pronouns', 'A2',
 'mein, dein, sein, ihr, unser, euer, ihr',
 'my, your, his, her, our, your, their', 20, 0.7),

-- B1 Level (Target)
('prateritum', 'Prateritum', 'Simple Past', 'B1',
 'Einfache Vergangenheit: ich ging, ich sah',
 'Simple past tense', 25, 1.0),

('subordinate_weil_dass', 'Nebensatze mit weil/dass', 'Subordinate clauses (weil/dass)', 'B1',
 'Nebensatze: Ich weiss, dass... Ich bleibe, weil...',
 'Subordinate clauses with weil and dass', 26, 1.2),

('subordinate_wenn_als', 'Nebensatze mit wenn/als', 'Subordinate clauses (wenn/als)', 'B1',
 'Temporale Nebensatze: wenn vs als',
 'Temporal clauses: wenn vs als', 27, 1.2),

('subordinate_obwohl', 'Nebensatze mit obwohl', 'Subordinate clauses (obwohl)', 'B1',
 'Konzessive Nebensatze: Obwohl es regnet...',
 'Concessive clauses', 28, 1.0),

('relative_clauses', 'Relativsatze', 'Relative Clauses', 'B1',
 'Der Mann, der... Die Frau, die... Das Kind, das...',
 'Relative clauses with der, die, das', 29, 1.3),

('infinitive_zu', 'Infinitiv mit zu', 'Infinitive with zu', 'B1',
 'Ich versuche zu lernen. Es ist wichtig zu...',
 'Infinitive constructions with zu', 30, 1.0),

('konjunktiv_ii_wurden', 'Konjunktiv II (wurden)', 'Subjunctive (wurden)', 'B1',
 'Ich wurde gern... Er wurde lieber...',
 'Would-constructions', 31, 1.1),

('konjunktiv_ii_waren_hatten', 'Konjunktiv II (ware/hatte)', 'Subjunctive (ware/hatte)', 'B1',
 'Wenn ich reich ware... Wenn ich Zeit hatte...',
 'If I were rich... If I had time...', 32, 1.1),

('passive_present', 'Passiv Prasens', 'Passive Present', 'B1',
 'Das Buch wird gelesen. Der Brief wird geschrieben.',
 'Present passive voice', 33, 1.0),

('passive_past', 'Passiv Prateritum', 'Passive Past', 'B1',
 'Das Buch wurde gelesen. Der Brief wurde geschrieben.',
 'Past passive voice', 34, 1.0),

('genitive_case', 'Genitiv', 'Genitive Case', 'B1',
 'Des Mannes, der Frau, des Kindes',
 'Genitive case for possession', 35, 0.9),

('adjective_declension', 'Adjektivdeklination', 'Adjective Declension', 'B1',
 'der gute Mann, ein guter Mann, guter Mann',
 'Adjective endings in all cases', 36, 1.2),

('indirect_questions', 'Indirekte Fragen', 'Indirect Questions', 'B1',
 'Ich weiss nicht, wo er ist. Kannst du mir sagen, wie...',
 'Embedded questions', 37, 1.0),

('future_werden', 'Futur mit werden', 'Future with werden', 'B1',
 'Ich werde morgen kommen. Es wird regnen.',
 'Future tense with werden', 38, 0.8),

('plusquamperfekt', 'Plusquamperfekt', 'Past Perfect', 'B1',
 'Ich hatte gegessen. Er war gegangen.',
 'Past perfect tense', 39, 0.9),

('double_infinitive', 'Doppelter Infinitiv', 'Double Infinitive', 'B1',
 'Ich habe schwimmen konnen. Er hatte gehen mussen.',
 'Perfect tense with modal verbs', 40, 0.8);
