// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev Represents a fixed-point decimal number with 18 decimal places.
struct Decimal {
    uint256 value;
}

library DecimalMath {
    uint256 public constant DECIMAL_PRECISION = 1e6;

    /// @dev Converts a whole number to Decimal (with 18 decimal precision).
    function fromNumber(uint256 value) internal pure returns (Decimal memory) {
        return Decimal({value: value * DECIMAL_PRECISION});
    }

    /// @dev Converts a Decimal to its whole number and remainder parts.
    function toNumber(
        Decimal memory d
    ) internal pure returns (uint256 whole, Decimal memory remainder) {
        whole = d.value / DECIMAL_PRECISION;
        remainder = Decimal({value: d.value % DECIMAL_PRECISION});
    }

    /// @dev Returns the floor (whole number) of a Decimal.
    function floor(Decimal memory d) internal pure returns (uint256) {
        return d.value / DECIMAL_PRECISION;
    }

    /// @dev Returns the ceiling (rounded up) of a Decimal.
    function ceil(Decimal memory d) internal pure returns (uint256) {
        return (d.value + DECIMAL_PRECISION - 1) / DECIMAL_PRECISION;
    }

    /// @dev Multiplies two Decimals.
    function mul(
        Decimal memory a,
        Decimal memory b
    ) internal pure returns (Decimal memory) {
        return Decimal({value: (a.value * b.value) / DECIMAL_PRECISION});
    }

    /// @dev Multiplies a Decimal by a scalar (uint256).
    function mulScalar(
        Decimal memory a,
        uint256 scalar
    ) internal pure returns (Decimal memory) {
        return Decimal({value: a.value * scalar});
    }

    /// @dev Divides one Decimal by another.
    function div(
        Decimal memory a,
        Decimal memory b
    ) internal pure returns (Decimal memory) {
        return Decimal({value: (a.value * DECIMAL_PRECISION) / b.value});
    }

    /// @dev Divides a Decimal by a scalar (uint256).
    function divScalar(
        Decimal memory a,
        uint256 scalar
    ) internal pure returns (Decimal memory) {
        return Decimal({value: a.value / scalar});
    }

    /// @dev Adds two Decimals.
    function add(
        Decimal memory a,
        Decimal memory b
    ) internal pure returns (Decimal memory) {
        return Decimal({value: a.value + b.value});
    }

    /// @dev Subtracts one Decimal from another.
    function sub(
        Decimal memory a,
        Decimal memory b
    ) internal pure returns (Decimal memory) {
        return Decimal({value: a.value - b.value});
    }

    /// @dev Creates a Decimal from a ratio of two integers.
    function fromRatio(
        uint256 num,
        uint256 denom
    ) internal pure returns (Decimal memory) {
        require(denom != 0, "DecimalMath: division by zero");
        return Decimal({value: (num * DECIMAL_PRECISION) / denom});
    }

    /// @dev Greater-than comparison for Decimals.
    function gt(
        Decimal memory a,
        Decimal memory b
    ) internal pure returns (bool) {
        return a.value > b.value;
    }

    /// @dev Less-than comparison for Decimals.
    function lt(
        Decimal memory a,
        Decimal memory b
    ) internal pure returns (bool) {
        return a.value < b.value;
    }

    /// @dev Equality comparison for Decimals.
    function eq(
        Decimal memory a,
        Decimal memory b
    ) internal pure returns (bool) {
        return a.value == b.value;
    }

    /// @dev Returns the minimum of two Decimals.
    function min(
        Decimal memory a,
        Decimal memory b
    ) internal pure returns (Decimal memory) {
        return a.value <= b.value ? a : b;
    }

    /// @dev Returns the maximum of two Decimals.
    function max(
        Decimal memory a,
        Decimal memory b
    ) internal pure returns (Decimal memory) {
        return a.value >= b.value ? a : b;
    }
}
