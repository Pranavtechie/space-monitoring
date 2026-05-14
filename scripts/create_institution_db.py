#!/usr/bin/env python3
from __future__ import annotations

import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSV_DIR = ROOT / "data" / "university-orgs-csv"
DB_PATH = ROOT / "data" / "space-monitoring.sqlite"


INSTITUTIONS = {
    "arizona-state-university": ("Arizona State University", "https://www.asu.edu", "Tempe", "AZ", "United States", "US", "university", "public", None),
    "brown-university": ("Brown University", "https://www.brown.edu", "Providence", "RI", "United States", "US", "university", "private", None),
    "california-state-polytechnic-university-pomona": ("California State Polytechnic University, Pomona", "https://www.cpp.edu", "Pomona", "CA", "United States", "US", "university", "public", None),
    "columbia-university": ("Columbia University", "https://www.columbia.edu", "New York", "NY", "United States", "US", "university", "private", None),
    "embry-riddle-aeronautical-university-prescott": ("Embry-Riddle Aeronautical University, Prescott", "https://prescott.erau.edu", "Prescott", "AZ", "United States", "US", "university", "private", "Prescott campus."),
    "harvard-university": ("Harvard University", "https://www.harvard.edu", "Cambridge", "MA", "United States", "US", "university", "private", None),
    "institute-for-advanced-studies-sao-jose-dos-campos": ("Institute for Advanced Studies", "https://www.gov.br/defesa/pt-br/assuntos/ensino-e-pesquisa/instituto-de-estudos-avancados-ieav", "Sao Jose dos Campos", "SP", "Brazil", "BR", "research_institute", "public", "Brazilian aerospace research institute commonly abbreviated IEAv."),
    "massachussets-institute-of-technology": ("Massachusetts Institute of Technology", "https://www.mit.edu", "Cambridge", "MA", "United States", "US", "university", "private", "CSV slug preserves the original misspelling: massachussets."),
    "mississippi-state-university": ("Mississippi State University", "https://www.msstate.edu", "Starkville", "MS", "United States", "US", "university", "public", None),
    "missouri-university-of-science-and-technology": ("Missouri University of Science and Technology", "https://www.mst.edu", "Rolla", "MO", "United States", "US", "university", "public", None),
    "northeastern-university": ("Northeastern University", "https://www.northeastern.edu", "Boston", "MA", "United States", "US", "university", "private", None),
    "polytechnique-montreal": ("Polytechnique Montreal", "https://www.polymtl.ca", "Montreal", "QC", "Canada", "CA", "engineering_school", "public", None),
    "portland-state-university": ("Portland State University", "https://www.pdx.edu", "Portland", "OR", "United States", "US", "university", "public", None),
    "rice-university": ("Rice University", "https://www.rice.edu", "Houston", "TX", "United States", "US", "university", "private", None),
    "rose-hulman-institute-of-technology": ("Rose-Hulman Institute of Technology", "https://www.rose-hulman.edu", "Terre Haute", "IN", "United States", "US", "college", "private", None),
    "rutgers-university": ("Rutgers University", "https://www.rutgers.edu", "New Brunswick", "NJ", "United States", "US", "university", "public", "Flagship campus/system entry."),
    "stanford-university": ("Stanford University", "https://www.stanford.edu", "Stanford", "CA", "United States", "US", "university", "private", None),
    "tel-aviv-university": ("Tel Aviv University", "https://english.tau.ac.il", "Tel Aviv", None, "Israel", "IL", "university", "public", None),
    "texas-a-and-m-university": ("Texas A&M University", "https://www.tamu.edu", "College Station", "TX", "United States", "US", "university", "public", None),
    "texas-state-university": ("Texas State University", "https://www.txst.edu", "San Marcos", "TX", "United States", "US", "university", "public", None),
    "the-cooper-union": ("The Cooper Union", "https://cooper.edu", "New York", "NY", "United States", "US", "college", "private", None),
    "the-university-of-texas-at-austin": ("The University of Texas at Austin", "https://www.utexas.edu", "Austin", "TX", "United States", "US", "university", "public", None),
    "united-states-naval-academy": ("United States Naval Academy", "https://www.usna.edu", "Annapolis", "MD", "United States", "US", "service_academy", "public", None),
    "university-at-buffalo": ("University at Buffalo", "https://www.buffalo.edu", "Buffalo", "NY", "United States", "US", "university", "public", "Also known as SUNY Buffalo."),
    "university-of-alberta": ("University of Alberta", "https://www.ualberta.ca", "Edmonton", "AB", "Canada", "CA", "university", "public", None),
    "university-of-arizona": ("University of Arizona", "https://www.arizona.edu", "Tucson", "AZ", "United States", "US", "university", "public", None),
    "university-of-california-berkeley": ("University of California, Berkeley", "https://www.berkeley.edu", "Berkeley", "CA", "United States", "US", "university", "public", None),
    "university-of-california-davis": ("University of California, Davis", "https://www.ucdavis.edu", "Davis", "CA", "United States", "US", "university", "public", None),
    "university-of-california-los-angeles": ("University of California, Los Angeles", "https://www.ucla.edu", "Los Angeles", "CA", "United States", "US", "university", "public", None),
    "university-of-california-san-diego": ("University of California San Diego", "https://ucsd.edu", "San Diego", "CA", "United States", "US", "university", "public", None),
    "university-of-california-santa-barbara": ("University of California, Santa Barbara", "https://www.ucsb.edu", "Santa Barbara", "CA", "United States", "US", "university", "public", None),
    "university-of-california-santa-cruz": ("University of California, Santa Cruz", "https://www.ucsc.edu", "Santa Cruz", "CA", "United States", "US", "university", "public", None),
    "university-of-central-florida": ("University of Central Florida", "https://www.ucf.edu", "Orlando", "FL", "United States", "US", "university", "public", None),
    "university-of-louisiana-at-lafayette": ("University of Louisiana at Lafayette", "https://louisiana.edu", "Lafayette", "LA", "United States", "US", "university", "public", None),
    "university-of-maryland": ("University of Maryland, College Park", "https://www.umd.edu", "College Park", "MD", "United States", "US", "university", "public", None),
    "university-of-nevada-las-vegas": ("University of Nevada, Las Vegas", "https://www.unlv.edu", "Las Vegas", "NV", "United States", "US", "university", "public", None),
    "university-of-new-mexico": ("University of New Mexico", "https://www.unm.edu", "Albuquerque", "NM", "United States", "US", "university", "public", None),
    "university-of-notre-dame": ("University of Notre Dame", "https://www.nd.edu", "Notre Dame", "IN", "United States", "US", "university", "private", None),
    "university-of-washington": ("University of Washington", "https://www.washington.edu", "Seattle", "WA", "United States", "US", "university", "public", None),
    "virginia-tech": ("Virginia Tech", "https://www.vt.edu", "Blacksburg", "VA", "United States", "US", "university", "public", None),
    "western-michigan-university": ("Western Michigan University", "https://wmich.edu", "Kalamazoo", "MI", "United States", "US", "university", "public", None),
    "yale-university": ("Yale University", "https://www.yale.edu", "New Haven", "CT", "United States", "US", "university", "private", None),
}


def grouped_csvs() -> dict[str, list[Path]]:
    groups: dict[str, list[Path]] = {}
    for path in sorted(CSV_DIR.glob("*.csv")):
        slug = path.stem.strip()
        groups.setdefault(slug, []).append(path)
    return groups


def main() -> None:
    groups = grouped_csvs()
    missing = sorted(set(groups) - set(INSTITUTIONS))
    stale = sorted(set(INSTITUTIONS) - set(groups))
    if missing or stale:
        raise SystemExit(f"CSV/data mismatch. missing={missing} stale={stale}")

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(
            """
            PRAGMA foreign_keys = ON;
            CREATE TABLE institution (
              id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
              name TEXT NOT NULL,
              slug TEXT NOT NULL UNIQUE,
              website TEXT NOT NULL,
              city TEXT NOT NULL,
              state TEXT,
              country TEXT NOT NULL,
              country_code TEXT NOT NULL,
              institution_type TEXT NOT NULL DEFAULT 'university',
              funding_type TEXT NOT NULL,
              source_csv_path TEXT NOT NULL,
              duplicate_csv_paths TEXT,
              notes TEXT,
              created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
              updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
            );
            CREATE INDEX institution_slug_idx ON institution (slug);
            CREATE INDEX institution_type_idx ON institution (institution_type);
            CREATE INDEX institution_funding_type_idx ON institution (funding_type);
            CREATE INDEX institution_location_idx ON institution (country_code, state, city);
            """
        )
        rows = []
        for slug, paths in sorted(groups.items()):
            name, website, city, state, country, country_code, institution_type, funding_type, notes = INSTITUTIONS[slug]
            primary = min(paths, key=lambda p: (p.name.startswith(" "), p.name))
            duplicates = [str(p.relative_to(ROOT)) for p in paths if p != primary]
            rows.append(
                (
                    name,
                    slug,
                    website,
                    city,
                    state,
                    country,
                    country_code,
                    institution_type,
                    funding_type,
                    str(primary.relative_to(ROOT)),
                    json.dumps(duplicates) if duplicates else None,
                    notes,
                )
            )
        conn.executemany(
            """
            INSERT INTO institution (
              name, slug, website, city, state, country, country_code,
              institution_type, funding_type, source_csv_path, duplicate_csv_paths, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
        conn.commit()
    finally:
        conn.close()

    print(f"Wrote {DB_PATH.relative_to(ROOT)} with {len(groups)} institutions")


if __name__ == "__main__":
    main()
