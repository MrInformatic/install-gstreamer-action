import * as core from '@actions/core'
import * as process from 'process'
import * as child_process from 'child_process'
import * as fs from 'fs'
import download from 'download'

async function install_mac(url: string): Promise<void> {
  await download(url, 'package.pkg')

  child_process.execSync('sudo installer -pkg package.pkg -target /')

  fs.rmSync('package.pkg')
}

async function install_win(url: string): Promise<void> {
  await download(url, 'installer.msi')

  child_process.execSync('msiexec.exe / i installer.msi / qn')

  fs.rmSync('installer.msi')
}

async function run(): Promise<void> {
  try {
    const arch: string = core.getInput('arch')
    const version: string = core.getInput('version')

    const linux_packages = [
      'libsystemd-dev',
      'libwebp-dev',
      'libxcb-shape0-dev',
      'libxcb-xfixes0-dev',
      'libgtk-3-dev',
      'libgstreamer1.0-dev',
      'libgstreamer-plugins-base1.0-dev',
      'gstreamer1.0-plugins-base',
      'gstreamer1.0-plugins-good',
      'gstreamer1.0-plugins-bad',
      'gstreamer1.0-plugins-ugly',
      'gstreamer1.0-libav',
      'libgstrtspserver-1.0-dev',
      'libges-1.0-dev'
    ]

    let vars: string[] = []

    switch (process.platform) {
      case 'linux':
        child_process.exec(`
        sudo apt-get update
        sudo apt-get remove -y libunwind-14-dev
        sudo apt install ${linux_packages.map(p => `${p}:${arch}`).join(' ')}
        `)

        break
      case 'darwin':
        install_mac(
          `https://gstreamer.freedesktop.org/data/pkg/osx/$GST_VERSION/gstreamer-1.0-${version}-universal.pkg`
        )
        install_mac(
          `https://gstreamer.freedesktop.org/data/pkg/osx/$GST_VERSION/gstreamer-1.0-devel-${version}-universal.pkg`
        )

        vars = ['PATH', 'PKG_CONFIG_PATH']

        process.env.PATH = `/Library/Frameworks/GStreamer.framework/Versions/1.0/bin:${process.env.PATH}`
        process.env.PKG_CONFIG_PATH = `/Library/Frameworks/GStreamer.framework/Versions/1.0/lib/pkgconfig`

        break
      case 'win32':
        install_win(
          `https://gstreamer.freedesktop.org/data/pkg/windows/$Env:GST_VERSION/msvc/gstreamer-1.0-msvc-${arch}-${version}.msi`
        )
        install_win(
          `https://gstreamer.freedesktop.org/data/pkg/windows/$Env:GST_VERSION/msvc/gstreamer-1.0-devel-msvc-${arch}-${version}.msi`
        )

        vars = ['PATH', 'PKG_CONFIG_PATH']

        process.env.PATH = `C:\\gstreamer\\1.0\\msvc_x86_64\\bin;${process.env.PATH}`
        process.env.PKG_CONFIG_PATH = `C:\\gstreamer\\1.0\\msvc_x86_64\\lib\\pkgconfig;${process.env.PKG_CONFIG_PATH}`
        break
    }

    const github_env = process.env.GITHUB_ENV
    if (github_env !== undefined) {
      fs.appendFileSync(
        github_env,
        vars.map(v => `${v}=${process.env[v]}`).join('\n')
      )
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
