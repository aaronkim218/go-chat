{
  description = "go-chat dev environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      pkgs = nixpkgs.legacyPackages.aarch64-darwin;
    in {
      devShells.aarch64-darwin.default = pkgs.mkShell {
        packages = with pkgs; [
          # backend (backend/go.mod requires >= 1.24)
          go
          gopls
          gofumpt
          golangci-lint

          # frontend
          nodejs_24
          pnpm

          # tooling
          just
          supabase-cli
        ];
      };
    };
}
