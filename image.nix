# OCI image for the digital garden: Caddy serving the pre-built ./public.
#
# Built in CI with `nix-build image.nix` AFTER `npx quartz build` has produced
# ./public. Deliberately a plain nix-build file, not a flake output: ./public is
# gitignored, so flake evaluation (which only sees tracked files) can't read it,
# whereas nix-build copies the path from the working tree as-is.
{
  publicDir ? ./public,
  pkgs ?
    import (fetchTarball {
      url = "https://github.com/NixOS/nixpkgs/archive/1da52dd49a127ad74486b135898da2cef8c62665.tar.gz";
      sha256 = "sha256-KRwX9Z1XavpgeSDVM/THdFd6uH8rNm/6R+7kIbGa+2s=";
    }) {},
}: let
  # Lay out the container filesystem: static site, Caddyfile, and writable XDG
  # dirs so Caddy has somewhere to keep its state without depending on $HOME.
  siteRoot = pkgs.runCommand "garden-root" {} ''
    mkdir -p $out/usr/share/caddy $out/etc/caddy $out/data $out/config $out/tmp
    cp -r ${publicDir}/. $out/usr/share/caddy/
    cp ${./Caddyfile} $out/etc/caddy/Caddyfile
  '';
in
  pkgs.dockerTools.buildLayeredImage {
    name = "obsidian-garden";
    tag = "latest";
    contents = [pkgs.caddy siteRoot];
    config = {
      Cmd = ["${pkgs.caddy}/bin/caddy" "run" "--config" "/etc/caddy/Caddyfile" "--adapter" "caddyfile"];
      ExposedPorts = {"80/tcp" = {};};
      Env = [
        "XDG_DATA_HOME=/data"
        "XDG_CONFIG_HOME=/config"
      ];
    };
  }
