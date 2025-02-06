{
  description = "NPM Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfreePredicate = pkg:
          builtins.elem (nixpkgs.lib.getName pkg) [
          ];
      };
    in {
      devShells = {
        default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs
          ];
          shellHook = ''
            npm i
          '';
        };
      };
    });
}
