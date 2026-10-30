#!/usr/bin/env bash
# TelePakt.pl - One-click GitHub Repository setup and push script

set -e

echo "========================================================"
echo "🛡️  TelePakt.pl - GitHub Repository Setup & Push Utility"
echo "========================================================"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git nie jest zainstalowany. Zainstaluj git przed uruchomieniem."
    exit 1
fi

# Initialize git if not present
if [ ! -d ".git" ]; then
    echo "📦 Inicjalizacja lokalnego repozytorium Git..."
    git init -b main
    git config user.name "TelePakt Bot"
    git config user.email "matlix@gmail.com"
fi

echo "➕ Dodawanie wszystkich plików projektu..."
git add -A

COMMIT_MSG="feat: complete TelePakt.pl platform with Django backend, Admin panel, and mobile mockups"
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "ℹ️  Brak nowych zmian do zatwierdzenia."
else
    echo "💾 Tworzenie commita: '$COMMIT_MSG'..."
    git commit -m "$COMMIT_MSG"
fi

echo ""
echo "Wybierz metodę wypchnięcia do GitHub:"
echo "1) Użyj GitHub CLI ('gh repo create TelePakt --public --source=. --push')"
echo "2) Podaj ręcznie URL zdalnego repozytorium (np. https://github.com/twoj-login/TelePakt.git)"
echo "3) Tylko przygotuj lokalne repozytorium (nie wypychaj teraz)"
echo ""

read -p "Wybierz opcję [1, 2 lub 3]: " choice

case $choice in
    1)
        if command -v gh &> /dev/null; then
            echo "🚀 Tworzenie repozytorium przez GitHub CLI..."
            gh repo create TelePakt --public --source=. --remote=origin --push
            echo "✅ Gotowe! Repozytorium zostało pomyślnie utworzone i zsynchronizowane na GitHub!"
        else
            echo "⚠️ Narzędzie 'gh' (GitHub CLI) nie jest zainstalowane."
            echo "Możesz je zainstalować lub wybrać opcję 2 z adresem URL."
        fi
        ;;
    2)
        read -p "Wklej adres URL twojego repozytorium na GitHub: " REMOTE_URL
        if [ -n "$REMOTE_URL" ]; then
            git remote remove origin 2>/dev/null || true
            git remote add origin "$REMOTE_URL"
            git branch -M main
            echo "🚀 Wypychanie gałęzi main do $REMOTE_URL..."
            git push -u origin main
            echo "✅ Sukces! Kod projektu TelePakt.pl znajduje się w Twoim repozytorium GitHub!"
        else
            echo "❌ Nie podano adresu URL. Anulowano."
        fi
        ;;
    3)
        echo "✅ Lokalne repozytorium Git jest gotowe z pełną historią commitów."
        echo "Gdy będziesz gotowy, wykonaj:"
        echo "   git remote add origin https://github.com/<twoj-login>/TelePakt.git"
        echo "   git push -u origin main"
        ;;
    *)
        echo "Niepoprawny wybór. Lokalne commity zostały zachowane."
        ;;
esac
