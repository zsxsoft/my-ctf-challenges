<?php
namespace Swoole\Database;

class PDOConfig
{
    public const DRIVER_MYSQL = 'mysql';

    public const DRIVER_PGSQL = 'pgsql';

    /** @var string */
    protected $driver = self::DRIVER_MYSQL;

    /** @var string */
    protected $host = '127.0.0.1';

    /** @var int */
    protected $port = 3306;

    /** @var null|string */
    protected $unixSocket;

    /** @var string */
    protected $dbname = 'test';

    /** @var string */
    protected $charset = 'utf8mb4';

    /** @var string */
    protected $username = 'root';

    /** @var string */
    protected $password = 'root';

    /** @var array */
    protected $options = [];

    public function getDriver(): string
    {
        return $this->driver;
    }

    public function withDriver(string $driver): self
    {
        $this->driver = $driver;
        return $this;
    }

    public function getHost(): string
    {
        return $this->host;
    }

    public function withHost($host): self
    {
        $this->host = $host;
        return $this;
    }

    public function getPort(): int
    {
        return $this->port;
    }

    public function hasUnixSocket(): bool
    {
        return isset($this->unixSocket);
    }

    public function getUnixSocket(): string
    {
        return $this->unixSocket;
    }

    public function withUnixSocket(?string $unixSocket): self
    {
        $this->unixSocket = $unixSocket;
        return $this;
    }

    public function withPort(int $port): self
    {
        $this->port = $port;
        return $this;
    }

    public function getDbname(): string
    {
        return $this->dbname;
    }

    public function withDbname(string $dbname): self
    {
        $this->dbname = $dbname;
        return $this;
    }

    public function getCharset(): string
    {
        return $this->charset;
    }

    public function withCharset(string $charset): self
    {
        $this->charset = $charset;
        return $this;
    }

    public function getUsername(): string
    {
        return $this->username;
    }

    public function withUsername(string $username): self
    {
        $this->username = $username;
        return $this;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function withPassword(string $password): self
    {
        $this->password = $password;
        return $this;
    }

    public function getOptions(): array
    {
        return $this->options;
    }

    public function withOptions(array $options): self
    {
        $this->options = $options;
        return $this;
    }

    /**
     * Returns the list of available drivers
     *
     * @return string[]
     */
    public static function getAvailableDrivers()
    {
        return [
            self::DRIVER_MYSQL,
            self::DRIVER_PGSQL,
        ];
    }
}

/**
 * @method PDO|PDOProxy get()
 * @method void put(PDO|PDOProxy $connection)
 */
class PDOPool
{
    /** @var int */
    protected $size = 64;

    /** @var PDOConfig */
    protected $config;

    public function __construct(PDOConfig $config)
    {
        $this->config = $config;
        new \PDO(
                "{$this->config->getDriver()}:" .
                (
                    $this->config->hasUnixSocket() ?
                    "unix_socket={$this->config->getUnixSocket()};" :
                    "host={$this->config->getHost()};" . "port={$this->config->getPort()};"
                ) .
                "dbname={$this->config->getDbname()};" .
                "charset={$this->config->getCharset()}",
                $this->config->getUsername(),
                $this->config->getPassword(),
                $this->config->getOptions()
            );

    }
}



namespace Swoole;

use RuntimeException;
use Swoole\Coroutine\Channel;
use Throwable;

class ConnectionPool
{
    public const DEFAULT_SIZE = 64;

    /** @var Channel */
    protected $pool;

    /** @var callable */
    protected $constructor;

    /** @var int */
    protected $size;

    /** @var int */
    protected $num;

    /** @var null|string */
    protected $proxy;

    public function __set($name, $value)
    {
      $this->$name = $value;
    }

    public function __construct(callable $constructor, int $size = self::DEFAULT_SIZE, ?string $proxy = null)
    {
        $this->constructor = $constructor;
        $this->num = 0;
        $this->proxy = $proxy;
    }
    public function get()
    {
        if ($this->pool === null) {
            throw new RuntimeException('Pool has been closed');
        }
        if ($this->pool->isEmpty() && $this->num < $this->size) {
            $this->make();
        }
        return $this->pool->pop();
    }

    public function put($connection): void
    {
        if ($this->pool === null) {
            return;
        }
        if ($connection !== null) {
            $this->pool->push($connection);
        } else {
            /* connection broken */
            $this->num -= 1;
        }
    }

    public function fill(): void
    {
        while ($this->size > $this->num) {
            $this->make();
        }
    }

    public function make(): void
    {
        $this->num++;
        try {
            if ($this->proxy) {
                $connection = new $this->proxy($this->constructor);
            } else {
                $constructor = $this->constructor;
                $connection = $constructor();
            }
        } catch (Throwable $throwable) {
            $this->num--;
            throw $throwable;
        }
        $this->put($connection);
    }
}



class ObjectProxy
{
    /** @var object */
    protected $__object;

    public function __construct($object)
    {
        $this->__object = $object;
    }

    public function __getObject()
    {
        return $this->__object;
    }

    public function __get(string $name)
    {
        return $this->__object->{$name};
    }

    public function __set(string $name, $value): void
    {
        $this->__object->{$name} = $value;
    }

    public function __isset($name)
    {
        return isset($this->__object->{$name});
    }

    public function __unset(string $name): void
    {
        unset($this->__object->{$name});
    }

    public function __call(string $name, array $arguments)
    {
        return $this->__object->{$name}(...$arguments);
    }

    public function __invoke(...$arguments)
    {
        /** @var mixed $object */
        $object = $this->__object;
        return $object(...$arguments);
    }
}


namespace Swoole\Database;
use \Swoole\ObjectProxy;
class PDOProxy extends ObjectProxy
{
    public const IO_ERRORS = [
        2002, // MYSQLND_CR_CONNECTION_ERROR
        2006, // MYSQLND_CR_SERVER_GONE_ERROR
        2013, // MYSQLND_CR_SERVER_LOST
    ];

    /** @var PDO */
    protected $__object;

    /** @var null|array */
    protected $setAttributeContext;

    /** @var callable */
    protected $constructor;

    /** @var int */
    protected $round = 0;


    public function __construct()
    {
//        parent::__construct($constructor());
//        var_dump($this);exit;
//        $this->__object->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
//        $this->constructor = $constructor;
    }

    public function inTransaction(): bool
    {
        return $this->__object->inTransaction();
    }

    public function reconnect(): void
    {
        $constructor = $this->constructor;
        var_dump($constructor);exit;
        parent::__construct($constructor());
        $this->round++;
        /* restore context */
        if ($this->setAttributeContext) {
            foreach ($this->setAttributeContext as $attribute => $value) {
                $this->__object->setAttribute($attribute, $value);
            }
        }
    }

    public function setConstructor ($a) {
      $this->constructor = $a;
    }
}

