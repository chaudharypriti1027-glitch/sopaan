// Monorepo hoisting can mismatch react vs react-test-renderer versions; skip RTL peer check.
process.env.RNTL_SKIP_DEPS_CHECK = 'true';
