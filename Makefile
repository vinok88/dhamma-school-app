.PHONY: build-web build-android build-ios clean run-web run-android run-ios test deps

# Build targets
build-web:
	flutter build web --release \
		--dart-define=SUPABASE_URL=$(SUPABASE_URL) \
		--dart-define=SUPABASE_ANON_KEY=$(SUPABASE_ANON_KEY) \
		--dart-define=GOOGLE_WEB_CLIENT_ID=$(GOOGLE_WEB_CLIENT_ID)

build-android:
	flutter build apk --release \
		--dart-define=SUPABASE_URL=$(SUPABASE_URL) \
		--dart-define=SUPABASE_ANON_KEY=$(SUPABASE_ANON_KEY)

build-android-bundle:
	flutter build appbundle --release \
		--dart-define=SUPABASE_URL=$(SUPABASE_URL) \
		--dart-define=SUPABASE_ANON_KEY=$(SUPABASE_ANON_KEY)

build-ios:
	flutter build ios --release --no-codesign \
		--dart-define=SUPABASE_URL=$(SUPABASE_URL) \
		--dart-define=SUPABASE_ANON_KEY=$(SUPABASE_ANON_KEY)

# Run targets
run-web:
	flutter run -d chrome \
		--dart-define=SUPABASE_URL=$(SUPABASE_URL) \
		--dart-define=SUPABASE_ANON_KEY=$(SUPABASE_ANON_KEY) \
		--dart-define=GOOGLE_WEB_CLIENT_ID=$(GOOGLE_WEB_CLIENT_ID)

run-android:
	flutter run -d android \
		--dart-define=SUPABASE_URL=$(SUPABASE_URL) \
		--dart-define=SUPABASE_ANON_KEY=$(SUPABASE_ANON_KEY)

run-ios:
	flutter run -d ios \
		--dart-define=SUPABASE_URL=$(SUPABASE_URL) \
		--dart-define=SUPABASE_ANON_KEY=$(SUPABASE_ANON_KEY)

# Code generation
codegen:
	flutter pub run build_runner build --delete-conflicting-outputs

codegen-watch:
	flutter pub run build_runner watch --delete-conflicting-outputs

# DB migrations
db-push:
	supabase db push

db-reset:
	supabase db reset

# Edge functions
deploy-functions:
	supabase functions deploy send-notification

# Dependencies
deps:
	flutter pub get

# Tests
test:
	flutter test

# Lint
lint:
	flutter analyze

# Clean
clean:
	flutter clean
	rm -rf build/
