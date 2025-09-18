<?php
$profile = [
    'name' => 'Roland Burmberger',
    'role' => 'Fullstack Webentwickler',
    'tagline' => 'Ich baue performante Kommunikationslösungen mit purem PHP und Vanilla JS.',
    'intro' => 'Steig ein in den Interview-Express und lerne meinen Werdegang als spielbare Kurzreise kennen.'
];

$stations = [
    [
        'id' => 'story',
        'title' => 'Station 1 · Story',
        'subtitle' => 'Wähle meine erste große Herausforderung',
        'content' => [
            'cms' => [
                'label' => 'CMS-Relaunch für lokale Handwerkskammer',
                'description' => 'Mit 20 habe ich ein bestehendes CMS komplett neu strukturiert, damit 30 Redakteure wieder effizient arbeiten konnten.'
            ],
            'intranet' => [
                'label' => 'Kommunikations-App für 150 Mitarbeiter',
                'description' => 'Ich entwickelte in drei Wochen eine Messenger- und Newsplattform mit granularen Rollenrechten.'
            ]
        ],
        'achievement' => 'Erfolg: Rollout innerhalb von 6 Wochen, Support inklusive.'
    ],
    [
        'id' => 'skills',
        'title' => 'Station 2 · Skills',
        'subtitle' => 'Finde meinen Lieblings-Stack',
        'question' => 'Welche Kombi sorgt bei mir für schnelle Releases?',
        'options' => [
            ['label' => 'PHP 8 · Vanilla JS · Tailwindless CSS', 'correct' => true, 'proof' => 'Damit shippe ich CMS-Features ohne Framework-Overhead.'],
            ['label' => 'Perl · Flash · Tables', 'correct' => false, 'proof' => 'Retro? Sicher. Produktiv? Nicht wirklich.'],
            ['label' => 'Rust Backend · WebGL Frontend', 'correct' => false, 'proof' => 'Spannend, aber für KMUs overkill.']
        ],
        'achievement' => 'Skill-Pass freigeschaltet: Backend trifft UX-Feinschliff.'
    ],
    [
        'id' => 'projects',
        'title' => 'Station 3 · Projekte',
        'subtitle' => 'Scan die Tickets, um Details zu erhalten',
        'projects' => [
            [
                'name' => 'TeamTalk Live',
                'summary' => 'Echtzeit-Kommunikations-App für Schichtbetriebe',
                'details' => 'Push Notifications, Moderationstools und ein internes FAQ senkten Supportaufwände um 40 %.',
                'tech' => 'PHP, WebSockets, Redis Pub/Sub',
                'role' => 'Konzept, Fullstack-Implementierung, Monitoring'
            ],
            [
                'name' => 'CityCMS Relaunch',
                'summary' => 'Barrierearmer Auftritt für eine Stadtverwaltung',
                'details' => 'Optimiertes CMS-Backend für 45 Redakteure, Lighthouse Performance 95+.',
                'tech' => 'PHP, MySQL, Alpine.js',
                'role' => 'Architektur, API-Integration, Schulung'
            ],
            [
                'name' => 'Learning Rails',
                'summary' => 'Gamifizierte Multiple-Choice-Lernstrecke',
                'details' => 'Bringt Azubis durch kurze Quiz-Sprints zu 30 % besseren Ergebnissen.',
                'tech' => 'PHP, Vanilla JS, IndexedDB',
                'role' => 'Game Design, Frontend, Analytics'
            ]
        ],
        'achievement' => 'Projektarchiv geöffnet: Proof geliefert.'
    ],
    [
        'id' => 'personality',
        'title' => 'Station 4 · Soft Skills',
        'subtitle' => 'Schalte meine Crew-Karten frei',
        'traits' => [
            [
                'name' => 'Crew Captain',
                'description' => 'Übernimmt Daily Standups und sorgt für Fokus auf das Wichtige.'
            ],
            [
                'name' => 'Bug Buster',
                'description' => 'Tracking mit Feature-Toggles und Post-Mortems spart Zeit und Nerven.'
            ],
            [
                'name' => 'Calm Communicator',
                'description' => 'Auch unter Zeitdruck bleiben Stakeholder informiert und gelassen.'
            ]
        ],
        'achievement' => 'Alle Crew-Karten eingesammelt. Ready for the final stop!'
    ],
];

$cta = [
    'message' => 'Bereit für eine gemeinsame Fahrt? Lass uns über dein nächstes Projekt sprechen.',
    'contact' => [
        'label' => 'Mail an Roland senden',
        'href' => 'mailto:hey@roland.codes'
    ],
    'download' => [
        'label' => 'CV als PDF',
        'href' => '#'
    ],
    'surprise' => 'Easter Egg: dreifaches Tippen auf die Hupe verrät meinen Lieblings-Snack im Nightshift.'
];
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rolands Interview-Express</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header class="hero">
    <div class="hero__content">
        <h1><?= htmlspecialchars($profile['name']) ?> · <?= htmlspecialchars($profile['role']) ?></h1>
        <p class="hero__tagline"><?= htmlspecialchars($profile['tagline']) ?></p>
        <p class="hero__intro"><?= htmlspecialchars($profile['intro']) ?></p>
        <button class="btn btn--primary" data-action="start">Fahrt starten</button>
        <a class="btn btn--ghost" href="#final-stop">Direkt zum Kontakt</a>
    </div>
    <div class="hero__train" role="img" aria-label="Stilisierter Zug als Symbol für den Karriereweg"></div>
</header>

<main>
    <section class="progress" aria-live="polite">
        <div class="progress__bar"><span></span></div>
        <p class="progress__label">Station 0 von <?= count($stations) ?></p>
    </section>

    <?php foreach ($stations as $index => $station): ?>
        <section class="station" id="station-<?= htmlspecialchars($station['id']) ?>" data-station-index="<?= $index + 1 ?>" hidden>
            <header>
                <h2><?= htmlspecialchars($station['title']) ?></h2>
                <p><?= htmlspecialchars($station['subtitle']) ?></p>
            </header>

            <?php if ($station['id'] === 'story'): ?>
                <div class="choices">
                    <?php foreach ($station['content'] as $key => $choice): ?>
                        <button class="card card--choice" data-story-choice="<?= htmlspecialchars($key) ?>">
                            <span><?= htmlspecialchars($choice['label']) ?></span>
                        </button>
                    <?php endforeach; ?>
                </div>
                <p class="station__result" data-result="story"></p>
            <?php elseif ($station['id'] === 'skills'): ?>
                <div class="quiz">
                    <p class="quiz__question"><?= htmlspecialchars($station['question']) ?></p>
                    <div class="quiz__options">
                        <?php foreach ($station['options'] as $option): ?>
                            <button class="card card--option" data-correct="<?= $option['correct'] ? 'true' : 'false' ?>" data-proof="<?= htmlspecialchars($option['proof']) ?>">
                                <?= htmlspecialchars($option['label']) ?>
                            </button>
                        <?php endforeach; ?>
                    </div>
                    <p class="station__result" data-result="skills"></p>
                </div>
            <?php elseif ($station['id'] === 'projects'): ?>
                <div class="project-grid">
                    <?php foreach ($station['projects'] as $project): ?>
                        <article class="card card--project" data-project>
                            <h3><?= htmlspecialchars($project['name']) ?></h3>
                            <p><?= htmlspecialchars($project['summary']) ?></p>
                            <button class="btn btn--secondary" data-project-open>Ticket scannen</button>
                            <dl class="project-details" hidden>
                                <dt>Outcome</dt>
                                <dd><?= htmlspecialchars($project['details']) ?></dd>
                                <dt>Stack</dt>
                                <dd><?= htmlspecialchars($project['tech']) ?></dd>
                                <dt>Rolle</dt>
                                <dd><?= htmlspecialchars($project['role']) ?></dd>
                            </dl>
                        </article>
                    <?php endforeach; ?>
                </div>
                <p class="station__result" data-result="projects"></p>
            <?php elseif ($station['id'] === 'personality'): ?>
                <div class="traits">
                    <?php foreach ($station['traits'] as $trait): ?>
                        <button class="card card--trait" data-trait>
                            <span class="trait__title"><?= htmlspecialchars($trait['name']) ?></span>
                            <span class="trait__text" hidden><?= htmlspecialchars($trait['description']) ?></span>
                        </button>
                    <?php endforeach; ?>
                </div>
                <p class="station__result" data-result="personality"></p>
            <?php endif; ?>

            <footer class="station__footer">
                <p class="achievement" data-achievement><?= htmlspecialchars($station['achievement']) ?></p>
                <div class="nav">
                    <button class="btn" data-action="prev">Zurück</button>
                    <button class="btn btn--primary" data-action="next" disabled>Weiter</button>
                </div>
            </footer>
        </section>
    <?php endforeach; ?>

    <section class="final" id="final-stop" hidden>
        <h2>Endstation · Recruiting Hub</h2>
        <p><?= htmlspecialchars($cta['message']) ?></p>
        <div class="final__actions">
            <a class="btn btn--primary" href="<?= htmlspecialchars($cta['contact']['href']) ?>"><?= htmlspecialchars($cta['contact']['label']) ?></a>
            <a class="btn btn--ghost" href="<?= htmlspecialchars($cta['download']['href']) ?>"><?= htmlspecialchars($cta['download']['label']) ?></a>
        </div>
        <p class="final__surprise"><?= htmlspecialchars($cta['surprise']) ?></p>
        <button class="btn btn--secondary" data-action="replay">Noch einmal fahren</button>
    </section>
</main>

<footer class="footer">
    <p>© <?= date('Y') ?> Roland Burmberger · Mit Liebe und purem PHP gefertigt.</p>
    <button class="btn btn--ghost" data-horn>Hupe</button>
    <span class="horn-secret" aria-live="polite"></span>
</footer>

<script src="assets/script.js"></script>
</body>
</html>
