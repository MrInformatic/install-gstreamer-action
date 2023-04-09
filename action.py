import platform
import subprocess
import argparse
import os

parser = argparse.ArgumentParser()
parser.add_argument("--arch", dest="arch", metavar="ARCH", type=str, required=True,
                    help="cpu architecture to install for")
parser.add_argument("--version", dest="version", metavar="VERSION", type=str, required=True,
                    help="version to install")

args = parser.parse_args()

arch = args.arch
version = args.version

vars = []

match platform.system():
    case "Linux":
        packages = [
            "libsystemd-dev",
            "libwebp-dev",
            "libxcb-shape0-dev",
            "libxcb-xfixes0-dev",
            "libgtk-3-dev",
            "libgstreamer1.0-dev",
            "libgstreamer-plugins-base1.0-dev",
            "gstreamer1.0-plugins-base",
            "gstreamer1.0-plugins-good",
            "gstreamer1.0-plugins-bad",
            "gstreamer1.0-plugins-ugly",
            "gstreamer1.0-libav",
            "libgstrtspserver-1.0-dev",
            "libges-1.0-dev"
        ]

        packages = map(packages, lambda package: f"{package}:{arch}")
        
        cmd = f"""
        sudo apt-get update
        sudo apt-get remove -y libunwind-14-dev
        sudo apt install {" ".join(packages)}
        """

        subprocess.run(cmd, shell=True)
    case "Darwin":
        def install(url):
            cmd = f"""
            wget -o package.pkg {url}
            sudo installer -pkg package.pkg -target /
            rm package.pkg
            """

            subprocess.run(cmd, shell=True)

        install(f"https://gstreamer.freedesktop.org/data/pkg/osx/$GST_VERSION/gstreamer-1.0-{version}-universal.pkg")
        install(f"https://gstreamer.freedesktop.org/data/pkg/osx/$GST_VERSION/gstreamer-1.0-devel-{version}-universal.pkg")

        vars = ["PATH", "PKG_CONFIG_PATH"]

        os.environ["PATH"] = "/Library/Frameworks/GStreamer.framework/Versions/1.0/bin:" + os.environ["PATH"]
        os.environ["PKG_CONFIG_PATH"] = "/Library/Frameworks/GStreamer.framework/Versions/1.0/lib/pkgconfig"

    case "Windows":
        def install(url):
            cmd = f"""
            wget -o installer.msi -Uri {url}

            msiexec.exe /i installer.msi /qn

            rm installer.msi
            """

            subprocess.run(cmd, shell=True)

        install(f"https://gstreamer.freedesktop.org/data/pkg/windows/$Env:GST_VERSION/msvc/gstreamer-1.0-msvc-{arch}-{version}.msi")
        install(f"https://gstreamer.freedesktop.org/data/pkg/windows/$Env:GST_VERSION/msvc/gstreamer-1.0-devel-msvc-{arch}-{version}.msi")

        vars = ["PATH", "PKG_CONFIG_PATH"]

        os.environ["PATH"] = "C:\\gstreamer\\1.0\\msvc_x86_64\\bin;" + os.environ["PATH"]
        os.environ["PKG_CONFIG_PATH"] = "C:\\gstreamer\\1.0\\msvc_x86_64\\lib\\pkgconfig;" + os.environ["PKG_CONFIG_PATH"]
        
with open(os.environ["GITHUB_ENV"], "a") as f:
    for var in vars:
        f.write(f"{var}="+os.environ[var])

        